import {
  Controller,
  Body,
  Get,
  Post,
  Put,
  Delete,
  Request,
  HttpCode,
  Param,
  UseGuards,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
  ConflictException
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { TransferProjectDto } from './dto/transfer-project.dto';
import { PrivacyProjectDto } from './dto/privacy-project.dto';
import { MemberIdDto } from './dto/member-id.dto';
import { CreateLabelDto } from './dto/labels/create-label.dto';
import { CreateIssueDto } from './dto/issues/create-issue.dto';
import { ProjectsService } from './projects.service';
import { Permission } from '../users/users.entity';
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
  ) {
    const { id: userId } = request.user as SessionUser;
    const result = await this.projectsService.create(createProjectDto, userId);
    if (!result) {
      throw new ConflictException({
        message: 'Cannot create the new project since one of your projects has the same name this project has.',
      });
    }
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
      throw new NotFoundException({
        message: 'The project does not exist.',
      });
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
      throw new NotFoundException({
        message: 'This project does not exist.',
      });
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
      case OperationResult.NotFound:
        throw new NotFoundException({
          message: 'The project does not exist.',
        });
      case OperationResult.Forbidden:
        throw new ForbiddenException({
          message: 'Cannot update this project since you are not a member of this project.',
        });
      case OperationResult.Conflict:
        throw new ConflictException({
          message: 'Cannot update this project since one of the owner\'s projects has the same name.',
        });
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
      case OperationResult.NotFound:
        throw new NotFoundException({
          message: 'The project does not exist.',
        });
      case OperationResult.Forbidden:
        throw new ForbiddenException({
          message: 'Cannot update the privacy since you are not the owner of this project.',
        });
    }
  }

  @Get(':id/members')
  async readMembersOfProject(
    @Param('id', IdValidationPipe) projectId: number,
    @Request() request: ExpressRequest,
  ) {
    const user: SessionUser | undefined = request.user as SessionUser;
    const userId: number | undefined = user && user.id;
    const permission: Permission | undefined = user && user.permission;
    const [result, memberIds] = await this.projectsService.readMembersOfProject(
      projectId,
      userId,
      permission,
    );

    if (result === OperationResult.NotFound) {
      throw new NotFoundException({
        message: 'The project does not exist',
      });
    }

    return { members: memberIds };
  }

  @UseGuards(AuthenticatedGuard)
  @Post(':id/members')
  async addUserToProject(
    @Param('id', IdValidationPipe) projectId: number,
    @Body(ValidationPipe) memberIdDto: MemberIdDto,
    @Request() request: ExpressRequest,
  ) {
    const { id: userId, permission } = request.user as SessionUser;
    const { id: memberId } = memberIdDto;
    const [result, resource] = await this.projectsService.addUserToProject(
      projectId,
      memberId,
      userId,
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
      if (resource === Resource.Project) {
        throw new ForbiddenException({
          message: 'Cannot add a new member since you are not the owner of this project.'
        });
      }
      else {
        throw new ForbiddenException({
          message: 'Cannot add a new member who is banned.'
        });
      }
    }

    if (result === OperationResult.Conflict) {
      throw new ConflictException({
        message: 'The target user has already been in this project.'
      });
    }
  }

  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/members')
  async removeUserFromProject(
    @Param('id', IdValidationPipe) projectId: number,
    @Body(ValidationPipe) memberIdDto: MemberIdDto,
    @Request() request: ExpressRequest,
  ) {
    const { id: userId, permission } = request.user as SessionUser;
    const { id: memberId } = memberIdDto;
    const [result, resource] = await this.projectsService.removeUserFromProject(
      projectId,
      memberId,
      userId,
      permission,
    );

    if (result === OperationResult.NotFound) {
      if (resource === Resource.Project) {
        throw new NotFoundException({
          message: 'The project does not exist.',
        });
      }
      else {
        throw new NotFoundException({
          message: 'The target member is not in this project.',
        });
      }
    }

    if (result === OperationResult.Forbidden) {
      if (resource === Resource.Project) {
        throw new ForbiddenException({
          message: 'Cannot remove the member since you are not the owner of this project.',
        });
      }
      else {
        throw new ForbiddenException({
          message: 'Cannot remove the owner of this project.',
        });
      }
    }
  }

  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteProject(
    @Param('id', IdValidationPipe) projectId: number,
    @Request() request: ExpressRequest,
  ) {
    const { id: userId, permission } = request.user as SessionUser;
    const result = await this.projectsService.deleteProjectById(projectId, userId, permission);

    if (result === OperationResult.NotFound) {
      throw new NotFoundException({
        message: 'The project does not exist.',
      });
    }

    if (result === OperationResult.Forbidden) {
      throw new ForbiddenException({
        message: 'Cannot delete this project since you are not the owner of it.',
      });
    }
  }

  @Get(':id/labels')
  async readAllLabelsOfProject(
    @Param('id', IdValidationPipe) projectId: number,
    @Request() request: ExpressRequest,
  ) {
    const user = request.user as SessionUser;
    const userId: number | undefined = user && user.id;
    const permission: Permission | undefined = user && user.permission;
    const [result, labelIds] = await this.projectsService.readAllLabelIds(
      projectId,
      userId,
      permission,
    );

    if (result === OperationResult.NotFound) {
      throw new NotFoundException({
        message: 'The project does not exist.',
      });
    }

    return { labels: labelIds };
  }

  @UseGuards(AuthenticatedGuard)
  @Post(':id/labels')
  async addNewLabelToProject(
    @Param('id', IdValidationPipe) projectId: number,
    @Body(ValidationPipe) createLabelDto: CreateLabelDto,
    @Request() request: ExpressRequest,
  ) {
    const { id: userId, permission } = request.user as SessionUser;
    const result = await this.projectsService.addNewLabel(
      projectId,
      createLabelDto,
      userId,
      permission
    );

    switch (result) {
      case OperationResult.NotFound:
        throw new NotFoundException({
          message: 'The project does not exist.',
        });
      case OperationResult.Forbidden:
        throw new ForbiddenException({
          message: 'Cannot add the new label since you are not the owner of this project.',
        });
      case OperationResult.Conflict:
        throw new ConflictException({
          message: 'Cannot add the new label since there is another label having the same name.'
        });
    }
  }

  @Get(':id/issues')
  async readAllIssues(
    @Param('id', IdValidationPipe) projectId: number,
    @Request() request: ExpressRequest,
  ) {
    const user: SessionUser | undefined = request.user as SessionUser;
    const userId: number | undefined = user && user.id;
    const permissesion: Permission | undefined = user && user.permission;

    const [result, issueIds] = await this.projectsService.readAllIssueIds(
      projectId,
      userId,
      permissesion,
    );

    if (result === OperationResult.NotFound) {
      throw new NotFoundException({
        message: 'The project does not exist.',
      });
    }

    return { issues: issueIds };
  }

  @UseGuards(AuthenticatedGuard)
  @Post(':id/issues')
  async createNewIssueToProject(
    @Param('id', IdValidationPipe) projectId: number,
    @Body(ValidationPipe) createIssueDto: CreateIssueDto,
    @Request() request: ExpressRequest,
  ) {
    const { id: userId, permission } = request.user as SessionUser;
    const [result, resource] = await this.projectsService.createNewIssue(
      projectId,
      createIssueDto,
      userId,
      permission,
    );

    if (result === OperationResult.NotFound) {
      throw new NotFoundException({
        message: 'The project does not exist.',
      });
    }

    if (result === OperationResult.Forbidden) {
      switch (resource) {
        case Resource.Project:
          throw new ForbiddenException({
            message: 'Cannot create the new issue since you are not a participant of this private project.',
          });
        case Resource.User:
          throw new ForbiddenException({
            message: 'Cannot create the new issue since one or many assignees do not participate this project.',
          });
        case Resource.Label:
          throw new ForbiddenException({
            message: 'Cannot create the new issue since one or many labels do not belong to this project.',
          });
      }
    }
  }
}
