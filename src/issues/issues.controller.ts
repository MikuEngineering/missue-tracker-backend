import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Request,
  HttpStatus,
  HttpCode,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { IssuesService } from './issues.service';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { Permission } from '../users/users.entity';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { ValidationPipe } from '../common/pipes/validation.pipe';
import { IdValidationPipe } from '../common/pipes/id-validation.pipe';
import { SessionUser } from '../common/types/session-user.type';
import { OperationResult } from '../common/types/operation-result.type';
import { Resource } from '../common/types/resource.type';

@Controller('issues')
export class IssuesController {
  constructor(
    private readonly issuesService: IssuesService,
  ) { }

  @Get(':id')
  async readOneById(
    @Param('id', IdValidationPipe) issueId: number,
    @Request() request: ExpressRequest,
  ) {
    const user: SessionUser | undefined = request.user as SessionUser;
    const userId: number | undefined = user && user.id;
    const permission: Permission | undefined = user && user.permission;

    const [result, readIssuesDto] = await this.issuesService.readOneById(
      issueId,
      userId,
      permission,
    );

    if (result === OperationResult.NotFound) {
      throw new NotFoundException({
        message: 'The project does not exist.',
      });
    }

    return readIssuesDto;
  }

  @UseGuards(AuthenticatedGuard)
  @Put(':id')
  async updateOneById(
    @Param('id', IdValidationPipe) issueId: number,
    @Body(ValidationPipe) updateIssueDto: UpdateIssueDto, 
    @Request() request: ExpressRequest,
  ) {
    const { id: userId, permission } = request.user as SessionUser;
    const [result, resource] = await this.issuesService.updateOneById(
      issueId,
      updateIssueDto,
      userId,
      permission,
    );

    if (result === OperationResult.NotFound) {
      throw new NotFoundException({
        message: 'The issue does not exist.',
      });
    }

    if (result === OperationResult.Forbidden) {
      switch (resource) {
        case Resource.Issue:
          throw new ForbiddenException({
            message: 'Cannot update the issue since you are not the owner of this issue or an participant of the project.',
          });
        case Resource.User:
          throw new ForbiddenException({
            message: 'Cannot update the issue since one or many of the assignees do not participate in the project.',
          });
        case Resource.Label:
          throw new ForbiddenException({
            message: 'Cannot update the issue since one or many of the labels do not belong to the project.',
          });
      }
    }
  }

  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async closeOneById(
    @Param('id', IdValidationPipe) issueId: number,
    @Request() request: ExpressRequest,
  ) {
    const { id: userId, permission } = request.user as SessionUser;
    const result = await this.issuesService.closeOneById(
      issueId,
      userId,
      permission,
    );

    switch (result) {
      case OperationResult.NotFound:
        throw new NotFoundException({
          message: 'The issue does not exist.',
        });
      case OperationResult.Forbidden:
        throw new NotFoundException({
          message: 'Cannot close this issue since you are not the owner nor a participant of this project.',
        });
    }
  }
}
