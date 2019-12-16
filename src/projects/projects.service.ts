import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './projects.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { User } from '../users/users.entity';
import { TagsService } from '../tags/tags.service';
import { Tag } from '../tags/tags.entity';

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
}
