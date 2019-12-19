import { Controller, Body, Post, Delete, Request, Response, Param, UseGuards, HttpStatus, ForbiddenException, NotFoundException, Get } from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { CreateProjectDto } from './dto/create-project.dto';
import { ReadProjectDto } from './dto/read-project.dto';
import { ProjectsService } from './projects.service';
import { User } from '../users/users.entity';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { ValidationPipe } from '../common/pipes/validation.pipe';
import { IdValidationPipe } from '../common/pipes/id-validation.pipe';
import { SessionUser } from '../common/types/session-user.type';
import { OperationResult } from '../common/types/operation-result.type';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(AuthenticatedGuard)
  @Post()
  async create(
    @Body(ValidationPipe) createProjectDto: CreateProjectDto,
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

  @Get(':id')
  async readProjectById(
    @Param('id', IdValidationPipe) projectId: number,
    @Request() request: ExpressRequest
  ) {
    const user: SessionUser = request.user as SessionUser;
    const userId: number | undefined = user && user.id;

    const [result, readProjectDto] = await this.projectsService.readProjectById(projectId, userId);

    if (result === OperationResult.NotFound) {
      throw new NotFoundException();
    }

    return readProjectDto;
  }

  @UseGuards(AuthenticatedGuard)
  @Delete(':id')
  async deleteProject(
    @Param('id', IdValidationPipe) projectId: number,
    @Request() request: ExpressRequest,
    @Response() response: ExpressResponse
  ) {
    const { id: userId, permission } = request.user as SessionUser;
    const result = await this.projectsService.deleteProjectById(projectId, userId, permission);

    if (result === OperationResult.NotFound) {
      throw new NotFoundException();
    }

    if (result === OperationResult.Forbidden) {
      throw new ForbiddenException();
    }

    response.status(HttpStatus.NO_CONTENT).send();
  }
}
