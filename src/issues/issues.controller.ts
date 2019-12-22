import { Controller, Get, Param, Request, NotFoundException } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { IssuesService } from './issues.service';
import { Permission } from '../users/users.entity';
import { IdValidationPipe } from '../common/pipes/id-validation.pipe';
import { SessionUser } from '../common/types/session-user.type';
import { OperationResult } from '../common/types/operation-result.type';

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
}
