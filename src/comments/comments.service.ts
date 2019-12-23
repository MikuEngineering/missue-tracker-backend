import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comments.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReadCommentDto } from './dto/read-comment.dto';
import { Permission } from '../users/users.entity';
import { Privacy } from '../projects/projects.entity';
import { OperationResult } from '../common/types/operation-result.type';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) { }

  async create(createCommentDto: CreateCommentDto) {
    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      owner: { id: createCommentDto.ownerId },
      issue: { id: createCommentDto.issueId },
    });

    await this.commentRepository.save(comment);
  }

  async readOneById(
    commentId: number,
    userId?: number,
    permission?: Permission,
  ): Promise<[OperationResult, ReadCommentDto?]>
  {
    const comment = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.owner', 'owner')
      .leftJoinAndSelect('comment.issue', 'issue')
      .leftJoinAndSelect('issue.project', 'project')
      .leftJoinAndSelect('project.participants', 'participant')
      .where('comment.id = :commentId', { commentId })
      .select(['comment', 'issue.id', 'project.id',
        'project.privacy', 'participant.id', 'owner.id'])
      .getOne();

    if (!comment) {
      return [OperationResult.NotFound, null];
    }

    const project = comment.issue.project;
    const isPrivate = project.privacy === Privacy.Private;
    const isParticipant = project.participants.some(user => user.id === userId);
    const isAdmin = permission === Permission.Admin;
    if (!isAdmin && isPrivate && !isParticipant) {
      return [OperationResult.NotFound, null];
    }

    const readCommentDto: ReadCommentDto = {
      content: comment.content,
      owner: comment.owner.id,
      createdTime: comment.createdTime.toJSON(),
      updatedTime: comment.updatedTime.toJSON(),
    };
    return [OperationResult.Success, readCommentDto];
  }
}
