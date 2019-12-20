import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Brackets } from 'typeorm';
import { Project, Status, Privacy } from './projects.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { ReadProjectDto } from './dto/read-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User, Permission } from '../users/users.entity';
import { TagsService } from '../tags/tags.service';
import { OperationResult } from '../common/types/operation-result.type';
import { Resource } from '../common/types/resource.type';

type Ownership = { ownerId: number };
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly tagsService: TagsService
  ) {}

  async create(createProjectDto: CreateProjectDto, user: User): Promise<boolean> {
    const project = await this.projectRepository.findOne({
      name: createProjectDto.name,
      owner: { id: user.id }
    });

    if (project) {
      return false;
    }

    let newProject = this.projectRepository.create({
      owner: { id: user.id },
      name: createProjectDto.name,
      description: createProjectDto.description,
      privacy: createProjectDto.privacy,
      participants: [{ id: user.id }]
    });

    newProject = await this.projectRepository.save(newProject);

    await this.tagsService.createMany(createProjectDto.tags, newProject.id);

    return true;
  }

  async readProjectByOwnerUsernameAndProjectName(
    ownerUsername: string,
    projectName: string,
    userId: number,
    permission: Permission,
  ): Promise<[OperationResult, number?]>
  {
    const project = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .where('project.name = :projectName', { projectName })
      .andWhere('owner.username = :username', { username: ownerUsername })
      .select(['project.id', 'project.privacy'])
      .getOne();

    // The project does not exist.
    if (!project) {
      return [OperationResult.NotFound, null];
    }

    // Return its id if it is a public project or the user is an admin.
    const isPublic = project.privacy === Privacy.Public;
    const isAdmin = permission === Permission.Admin;
    if (isPublic || isAdmin) {
      return [OperationResult.Success, project.id];
    }

    // Now the user is not an admin.
    // So check whether the user is a participant of the project.
    // If true, return the project's id, otherwise return NotFound.
    const count = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.participants', 'participant')
      .where('project.id = :projectId', { projectId: project.id })
      .andWhere('participant.id = :userId', { userId })
      .getCount();

    if (count < 1) {
      return [OperationResult.NotFound, null];
    }
    return [OperationResult.Success, project.id];
  }

  async readProjectById(
    projectId: number,
    userId: number | undefined,
    permission: Permission | undefined
  ): Promise<[OperationResult, ReadProjectDto?]>
  {
    const project = await this.projectRepository.findOne(projectId, { relations: ['participants', 'tags'] });

    const isNotFound = !project;
    if (isNotFound) {
      return [OperationResult.NotFound, null];
    }

    const isAdmin = permission === Permission.Admin;
    const isParticipating = project && project.participants.some(user => user.id === userId);
    const isPrivate = project && project.privacy === Privacy.Private;
    if (!isAdmin && isPrivate && !isParticipating) {
      return [OperationResult.NotFound, null];
    }

    const readProjectDto = new ReadProjectDto();
    readProjectDto.name = project.name;
    readProjectDto.description = project.description;
    readProjectDto.privacy = project.privacy;
    readProjectDto.tags = project.tags.map(tag => tag.name);
    readProjectDto.createdDate = project.created_time.toJSON();

    return [OperationResult.Success, readProjectDto];
  }

  async updateProjectById(
    updateProjectDto: UpdateProjectDto,
    projectId: number,
    userId: number,
    permission: Permission
  ): Promise<OperationResult>
  {
    const project = await this.projectRepository.findOne(projectId, { relations: ['owner', 'participants', 'tags'] });

    // Check whether the project exists
    if (!project) {
      return OperationResult.NotFound;
    }

    // Check permissions
    const isParticipating = project.participants.some(user => user.id === userId);
    const isAdmin = permission === Permission.Admin;
    if (!isParticipating && !isAdmin) {
      return OperationResult.Forbidden;
    }

    // Check conflict
    const count = await this.projectRepository.count({
      where: {
        id: Not(project.id),
        name: updateProjectDto.name, 
        owner: { id: project.owner.id },
        status: Status.Normal
      }
    });
    if (count > 0) {
      return OperationResult.Conflict;
    }

    // Update the project
    await this.projectRepository.update({ id: projectId }, {
      name: updateProjectDto.name,
      description: updateProjectDto.description,
      privacy: updateProjectDto.privacy,
    })

    // Update the tags
    await this.tagsService.updateTags(updateProjectDto.tags, projectId);

    return OperationResult.Success;
  }

  /**
   * Check the ownership of a project.
   * @param projectId The project's id.
   * @param ownerId The owner's id which will be checked.
   * @param isAdmin Is the user an admin.
   * @return If the project doesn't exist, return undefined.
   * If the project exists return the ownership object.
   */
  private async executeProjectOwnershipQuery(
    projectId: number,
    ownerId: number,
    isAdmin: boolean
  ): Promise<Ownership | undefined>
  {
    // Join project, owner, and participants and
    // search for the project by its id.
    const query = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoinAndSelect('project.participants', 'participant')
      .where('project.id = :projectId', { projectId });

    // If the user is not an admin, add conditions to the query.
    // These condtitions are used to check whether the user is
    // the owner or an participant of this project.
    if (!isAdmin) {
      query.andWhere(new Brackets((qb) => {
        qb.where('owner.id = :ownerId', { ownerId })
          .orWhere('participant.id = :participantId', { participantId: ownerId })
      }));
    }

    // Finally, get the owner's id.
    query.select('owner.id', 'ownerId');

    // Execute this query.
    return query.getRawOne();
  }

  async transferProject(
    projectId: number,
    targetUserId: number,
    ownerId: number,
    permission: number
  ): Promise<[OperationResult, Resource?]>
  {
    const isAdmin = permission === Permission.Admin;
    const project: Ownership =
      await this.executeProjectOwnershipQuery(projectId, ownerId, isAdmin);

    // The project does not exist.
    if (!project) {
      return [OperationResult.NotFound, Resource.Project];
    }

    // The user is not the project owner nor an admin.
    const isOwner = project.ownerId === ownerId;
    if (!isOwner && !isAdmin) {
      return [OperationResult.Forbidden, Resource.User];
    }

    return [OperationResult.Success, Resource.Project];
  }

  async deleteProjectById(projectId: number, userId: number, permission: Permission): Promise<OperationResult> {
    const project = await this.projectRepository.findOne(projectId, { select: ['id', 'owner'], relations: ['owner'] });

    if (!project) {
      return OperationResult.NotFound;
    }

    if (permission !== Permission.Admin && project.owner.id !== userId) {
      return OperationResult.Forbidden;
    }

    await this.projectRepository.update(projectId, { status: Status.Deleted });
    return OperationResult.Success;
  }
}
