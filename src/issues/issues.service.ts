import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from './issues.entity'
import { CreateIssueDto } from './dto/create-issue.dto';
import { CommentsService } from '../comments/comments.service';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';

function wrapIdsIntoObjects(ids: number[]) {
  return ids.map(id => ({ id }));
}

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    private readonly commentsService: CommentsService,
  ) { }

  async create(createIssueDto: CreateIssueDto) {
    // Calculate the next issue number.
    const count = await this.issueRepository.count({
      where: {
        project: { id: createIssueDto.projectId },
      },
    });
    const issueNumber = count + 1;

    // Transform labels and participants.
    const labelRelationIds = wrapIdsIntoObjects(createIssueDto.labelIds);
    const participantRelationIds = wrapIdsIntoObjects(createIssueDto.assigneeIds);

    // Create the new issue.
    let issue = this.issueRepository.create({
      number: issueNumber,
      title: createIssueDto.title,
      project: { id: createIssueDto.projectId },
      owner: { id: createIssueDto.ownerId },
      labels: labelRelationIds,
      assignees: participantRelationIds,
    });
    issue = await this.issueRepository.save(issue);

    // Create the first new comment.
    // Here use the issue id, so the issue need to be created first.
    const createCommentDto: CreateCommentDto = {
      ownerId: createIssueDto.ownerId,
      content: createIssueDto.comment.content,
      issueId: issue.id,
    };
    await this.commentsService.create(createCommentDto);
  }
}
