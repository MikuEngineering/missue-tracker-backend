import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Project, Status, Privacy } from './projects.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { ReadProjectDto } from './dto/read-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User, Permission } from '../users/users.entity';
import { TagsService } from '../tags/tags.service';
import { OperationResult } from '../common/types/operation-result.type';

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

  async readProjectByOwnerUsernameAndProjectName(ownerUsername: string, projectName: string): Promise<[OperationResult, number?]> {
    const project = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .where('project.name = :projectName', { projectName })
      .andWhere('owner.username = :username', { username: ownerUsername })
      .select('project.id')
      .getOne();

    if (!project) {
      return [OperationResult.NotFound, null];
    }

    return [OperationResult.Success, project.id];
  }

  async readProjectById(projectId: number, userId?: number): Promise<[OperationResult, ReadProjectDto?]> {
    const project = await this.projectRepository.findOne(projectId, { relations: ['participants', 'tags'] });

    const isNotFound = !project;
    const isParticipating = project && project.participants.some(user => user.id === userId);
    const isPrivate = project && project.privacy === Privacy.Private;
    if (isNotFound || (isPrivate && !isParticipating)) {
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
