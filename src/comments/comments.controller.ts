import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { CommentsService } from './comments.service';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Permission } from '../users/users.entity';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { IdValidationPipe } from '../common/pipes/id-validation.pipe';
import { ValidationPipe } from '../common/pipes/validation.pipe';
import { SessionUser } from '../common/types/session-user.type';
import { OperationResult } from '../common/types/operation-result.type';

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

  @UseGuards(AuthenticatedGuard)
  @Put(':id')
  async updateOneById(
    @Param('id', IdValidationPipe) commentId: number,
    @Body(ValidationPipe) updateCommentDto: UpdateCommentDto,
    @Request() request: ExpressRequest,
  ) {
    const { id: userId, permission } = request.user as SessionUser;
    const result = await this.commentsService.updateOneById(
      commentId,
      updateCommentDto,
      userId,
      permission,
    );

    switch (result) {
      case OperationResult.NotFound:
        throw new NotFoundException({
          message: 'The comment does not exist.',
        });
      case OperationResult.Forbidden:
        throw new ForbiddenException({
          message: 'Cannot modify this comment since you are not the owner of this comment.',
        });
    }
  }
}
