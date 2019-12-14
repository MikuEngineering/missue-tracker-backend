import { Controller, Body, Post, Request, Response, UseGuards, HttpStatus } from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';
import { User } from '../users/users.entity';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(AuthenticatedGuard)
  @Post()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() request: ExpressRequest,
    @Response() response: ExpressResponse,
  ) {
    const user: User = request.user as User;
    const result = await this.projectsService.create(createProjectDto, user);
    if (result) {
      response.status(HttpStatus.CREATED).send();
      return;
    }
    response.status(HttpStatus.CONFLICT).send();
  }
}
