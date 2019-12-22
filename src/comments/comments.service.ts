import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comments.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

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
}
