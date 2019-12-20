import {
  Controller,
  Body,
  Get,
  Post,
  Put,
  Delete,
  Request,
  Response,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
  ConflictException
} from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { TransferProjectDto } from './dto/transfer-project.dto';
import { PrivacyProjectDto } from './dto/privacy-project.dto';
import { ProjectsService } from './projects.service';
import { User, Permission } from '../users/users.entity';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { ValidationPipe } from '../common/pipes/validation.pipe';
import { IdValidationPipe } from '../common/pipes/id-validation.pipe';
import { QueryStringPipe } from '../common/pipes/query-string.validation.pipe';
import { SessionUser } from '../common/types/session-user.type';
import { OperationResult } from '../common/types/operation-result.type';
import { Resource } from '../common/types/resource.type';

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

  @Get()
  async readProjectIdByQueries(
    @QueryStringPipe('owner_username') ownerUsername: string,
    @QueryStringPipe('project_name') projectName: string,
    @Request() request: ExpressRequest,
  ) {
    const user = request.user as SessionUser;
    const userId = user && user.id;
    const permission = user && user.permission;

    const [result, projectId] =
      await this.projectsService.readProjectByOwnerUsernameAndProjectName(
        ownerUsername,
        projectName,
        userId,
        permission,
      );

    if (result === OperationResult.NotFound) {
      throw new NotFoundException();
    }

    return projectId;
  }

  @Get(':id')
  async readProjectById(
    @Param('id', IdValidationPipe) projectId: number,
    @Request() request: ExpressRequest
  ) {
    const user: SessionUser = request.user as SessionUser;
    const userId: number | undefined = user && user.id;
    const permission: Permission | undefined = user && user.permission;

    const [result, readProjectDto] =
      await this.projectsService.readProjectById(projectId, userId, permission);

    if (result === OperationResult.NotFound) {
      throw new NotFoundException();
    }

    return readProjectDto;
  }

  @UseGuards(AuthenticatedGuard)
  @Put(':id')
  async updateProjectById(
    @Param('id', IdValidationPipe) projectId: number,
    @Body(ValidationPipe) updateProjectDto: UpdateProjectDto,
    @Request() request: ExpressRequest,
  ) {
    const { id: userId, permission } = request.user as SessionUser;
    const result = await this.projectsService.updateProjectById(updateProjectDto, projectId, userId, permission);

    switch (result) {
      case OperationResult.NotFound: throw new NotFoundException();
      case OperationResult.Forbidden: throw new ForbiddenException();
      case OperationResult.Conflict: throw new ConflictException();
    }
  }

  @UseGuards(AuthenticatedGuard)
  @Put(':id/owner')
  async transferProject(
    @Param('id', IdValidationPipe) projectId: number,
    @Body(ValidationPipe) body: TransferProjectDto,
    @Request() request: ExpressRequest,
  ) {
    const { id: ownerId, permission } = request.user as SessionUser;
    const { id: targetUserId } = body;
    const [result, resource, reason] = await this.projectsService.transferProject(
      projectId,
      targetUserId,
      ownerId,
      permission,
    );

    if (result === OperationResult.NotFound) {
      if (resource === Resource.Project) {
        throw new NotFoundException({
          message: 'The project does not exist.'
        });
      }
      else {
        throw new NotFoundException({
          message: 'The target user does not exist.'
        });
      }
    }

    if (result === OperationResult.Forbidden) {
      throw new ForbiddenException({
        message: reason
      });
    }

    if (result === OperationResult.Conflict) {
      throw new ConflictException({
        message: "Cannot transfer the project to the target user who has a project whose name is the same as this project's."
      });
    }
  }

  @UseGuards(AuthenticatedGuard)
  @Put(':id/privacy')
  async changePrivacy(
    @Param('id', IdValidationPipe) projectId: number,
    @Body(ValidationPipe) privacyProjectDto: PrivacyProjectDto,
    @Request() request: ExpressRequest,
  ) {
    const { id: userId, permission } = request.user as SessionUser;
    const { privacy } = privacyProjectDto;
    const result = await this.projectsService.changePrivacy(
      projectId,
      privacy,
      userId,
      permission,
    );

    switch (result) {
      case OperationResult.NotFound: throw new NotFoundException();
      case OperationResult.Forbidden: throw new ForbiddenException();
    }
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
