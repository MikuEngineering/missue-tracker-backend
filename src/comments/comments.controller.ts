import { Controller, Get, Param, Body, Request, NotFoundException } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { CommentsService } from './comments.service';
import { Permission } from '../users/users.entity';
import { IdValidationPipe } from '../common/pipes/id-validation.pipe';
import { SessionUser } from '../common/types/session-user.type';
import { OperationResult } from 'src/common/types/operation-result.type';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
  ) { }

  @Get(':id')
  async readOneById(
    @Param('id', IdValidationPipe) commentId: number,
    @Request() request: ExpressRequest,
  ) {
    const user: SessionUser | undefined = request.user as SessionUser;
    const userId: number | undefined = user && user.id;
    const permission: Permission | undefined = user && user.permission;
    const [result, readCommentDto] = await this.commentsService.readOneById(
      commentId,
      userId,
      permission,
    );

    if (result === OperationResult.NotFound) {
      throw new NotFoundException({
        message: 'The comment does not exist.',
      });
    }

    return readCommentDto;
  }
}
