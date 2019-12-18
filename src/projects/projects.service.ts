import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, Status } from './projects.entity';
import { CreateProjectDto } from './dto/create-project.dto';
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
      privacy: createProjectDto.privacy
    });

    newProject = await this.projectRepository.save(newProject);

    await this.tagsService.createMany(createProjectDto.tags, newProject.id);

    return true;
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
