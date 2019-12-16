import { Test, TestingModule } from '@nestjs/testing';
import { getRepository } from 'typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsModule } from './projects.module';
import { Project } from './projects.entity';
import { User } from '../users/users.entity';
import { Tag } from '../tags/tags.entity';

interface IProject {
  id: number;
  owner: User;
  name: string;
  description: string;
  privacy: number;
  status: number;
  created_time: Date;
  tags: Tag[];
}

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ProjectsModule],
    })
    .compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
