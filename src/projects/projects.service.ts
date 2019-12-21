import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Brackets } from 'typeorm';
import { Project, Status, Privacy } from './projects.entity';

import { CreateProjectDto } from './dto/create-project.dto';
import { ReadProjectDto } from './dto/read-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateLabelDto } from './dto/labels/create-label.dto';

import { UsersService } from '../users/users.service';
import { User, Permission, Status as UserStatue } from '../users/users.entity';
import { TagsService } from '../tags/tags.service';
import { LabelsService } from '../labels/labels.service';
import { OperationResult } from '../common/types/operation-result.type';
import { Resource } from '../common/types/resource.type';

const REASON_USER_NOT_OWNER = 'You do not own this project so you cannot transfer this project.';
const REASON_TARGET_USER_BANNED = 'Cannot transfer this project to the target user who is banned.';
const REASON_TARGET_USER_NOT_PARTICIPANT = 'The target user is not a participant of this project.';
const REASON_TARGET_USER_HAS_PROJECT_SAME_NAME = 'The target user has a project whose name is the same as this project.'

type Ownership = { name: string, ownerId: number };

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly tagsService: TagsService,
    private readonly userService: UsersService,
    private readonly labelsService: LabelsService,
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

    // Finally, get the owner's id and the project's name.
    query.select('owner.id', 'ownerId')
      .addSelect('project.name', 'name');

    // Execute this query.
    return query.getRawOne();
  }

  async transferProject(
    projectId: number,
    targetUserId: number,
    ownerId: number,
    permission: number
  ): Promise<[OperationResult, Resource, string?]>
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
      return [OperationResult.Forbidden, Resource.User, REASON_USER_NOT_OWNER];
    }

    // Get the target user.
    const targetUser = await this.userService.findOne(targetUserId);
    if (!targetUser) {
      return [OperationResult.NotFound, Resource.User];
    }

    // Cannot transfer the project to the target user who is banned.
    if (targetUser.status === UserStatue.Banned) {
      return [OperationResult.Forbidden, Resource.User, REASON_TARGET_USER_BANNED];
    }

    // Search for the target user in the project.
    let count = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.participants', 'participant')
      .where('project.id = :projectId', { projectId })
      .andWhere('participant.id = :userId', { userId: targetUserId })
      .getCount();

    // Cannot transfer the project to the target user who is not a member in this project.
    if (count < 1) {
      return [OperationResult.Forbidden, Resource.User, REASON_TARGET_USER_NOT_PARTICIPANT];
    }

    // Check whether the target user has a project whose name is the same as this project's.
    count = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .where('project.name = :name', { name: project.name })
      .andWhere('owner.id = :userId', { userId: targetUserId })
      .getCount();

    // Cannot transfer the project to the target user who has a project whose name is the same as this project's.
    if (count > 0) {
      return [OperationResult.Conflict, Resource.User];
    }

    // Finnaly, transfer the project to the target users.
    await this.projectRepository.update({ id: projectId }, { owner: { id: targetUserId } });

    return [OperationResult.Success, Resource.Project];
  }

  async changePrivacy(
    projectId: number,
    privacy: Privacy,
    userId: number,
    permission: number
  ): Promise<OperationResult>
  {
    const project = await this.projectRepository.findOne(projectId, { relations: ['owner'] });
    if (!project) {
      return OperationResult.NotFound;
    }

    const isOwner = project.owner.id === userId;
    const isAdmin = permission === Permission.Admin;
    if (!isOwner && !isAdmin) {
      return OperationResult.Forbidden;
    }

    await this.projectRepository.update({ id: projectId }, { privacy });

    return OperationResult.Success;
  }

  async readMembersOfProject(
    projectId: number,
    userId?: number,
    permission?: Permission,
  ): Promise<[OperationResult, number[]?]>
  {
    const project = await this.projectRepository.findOne(projectId, {
      relations: ['participants']
    });

    if (!project) {
      return [OperationResult.NotFound, null];
    }

    const isPrivate = project.privacy === Privacy.Private;
    const isParticipant = userId && project.participants.some(user => user.id === userId);
    const isAdmin = permission && permission === Permission.Admin;
    if (isPrivate && !isParticipant && !isAdmin) {
      return [OperationResult.NotFound, null];
    }

    const memberIds = project.participants.map(user => user.id);
    return [OperationResult.Success, memberIds];
  }

  async addUserToProject(
    projectId: number,
    memberId: number,
    userId: number,
    permission: Permission
  ): Promise<[OperationResult, Resource?]>
  {
    const project = await this.projectRepository.findOne(projectId, {
      relations: ['participants', 'owner']
    });

    if (!project) {
      return [OperationResult.NotFound, Resource.Project];
    }

    const targetUser = await this.userService.findOne(memberId);
    if (!targetUser) {
      return [OperationResult.NotFound, Resource.User];
    }

    if (targetUser.status === UserStatue.Banned) {
      return [OperationResult.Forbidden, Resource.User];
    }

    const isOwner = userId === project.owner.id;
    const isAdmin = permission === Permission.Admin;
    if (!isOwner && !isAdmin) {
      return [OperationResult.Forbidden, Resource.Project];
    }

    const isMember = project.participants.some(user => user.id === memberId);
    if (isMember) {
      return [OperationResult.Conflict, null];
    }

    await this.projectRepository
      .createQueryBuilder('project')
      .relation('participants')
      .of(projectId)
      .add(memberId);

    return [OperationResult.Success, null];
  }

  async removeUserFromProject(
    projectId: number,
    memberId: number,
    userId: number,
    permission: Permission,
  ): Promise<[OperationResult, Resource]>
  {
    const project = await this.projectRepository.findOne(projectId, {
      relations: ['participants', 'owner'],
    });

    if (!project) {
      return [OperationResult.NotFound, Resource.Project];
    }

    const memberExistence = project.participants.some(user => user.id === memberId);
    if (!memberExistence) {
      return [OperationResult.NotFound, Resource.User];
    }

    const isOwner = project.owner.id === userId;
    const isAdmin = permission === Permission.Admin;
    if (!isOwner && !isAdmin) {
      return [OperationResult.Forbidden, Resource.Project];
    }

    if (project.owner.id === memberId) {
      return [OperationResult.Forbidden, Resource.User];
    }

    await this.projectRepository
      .createQueryBuilder('project')
      .relation('participants')
      .of(projectId)
      .remove(memberId);

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

  async addNewLabel(
    projectId: number,
    createLabelDto: CreateLabelDto,
    userId: number,
    permission: Permission,
  ): Promise<OperationResult>
  {
    const project = await this.projectRepository.findOne(projectId, { relations: ['owner'] });
    if (!project) {
      return OperationResult.NotFound;
    }

    const isOwner = project.owner.id === userId;
    const isAdmin = permission === Permission.Admin;
    if (!isOwner && !isAdmin) {
      return OperationResult.Forbidden;
    }

    return this.labelsService.create({
      name: createLabelDto.name,
      description: createLabelDto.description,
      color: createLabelDto.color,
      projectId
    });
  }
}
