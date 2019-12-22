import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from './issues.entity'
import { CreateIssueDto } from './dto/create-issue.dto';
import { ReadIssueDto } from './dto/read-issue.dto';
import { CommentsService } from '../comments/comments.service';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { Permission } from '../users/users.entity';
import { OperationResult } from '../common/types/operation-result.type';
import { Privacy } from 'src/projects/projects.entity';

function wrapIdsIntoObjects(ids: number[]) {
  return ids.map(id => ({ id }));
}

function unwrapIdsFromObjects(objects: { id: number }[]) {
  return objects.map(objId => objId.id);
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

  async readOneById(
    issueId: number,
    userId?: number,
    permission?: Permission,
  ): Promise<[OperationResult, ReadIssueDto?]>
  {
    const issue = await this.issueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.project', 'project')
      .leftJoinAndSelect('issue.owner', 'owner')
      .leftJoinAndSelect('issue.assignees', 'assignees')
      .leftJoinAndSelect('issue.labels', 'labels')
      .leftJoinAndSelect('project.participants', 'participants')
      .where('issue.id = :issueId', { issueId })
      .select(['issue.title', 'issue.number', 'issue.createdTime', 'issue.updatedTime'])
      .addSelect(['project.id', 'project.privacy'])
      .addSelect('participants.id')
      .addSelect('owner.id')
      .addSelect('assignees.id')
      .addSelect('labels.id')
      .getOne();

    if (!issue) {
      return [OperationResult.NotFound, null];
    }

    const { project, owner, assignees, labels } = issue;
    if (project.privacy === Privacy.Private) {
      const isParticipant = userId && project.participants.some(user => user.id === userId);
      const isAdmin = permission && permission === Permission.Admin;
      if (!isParticipant && !isAdmin) {
        return [OperationResult.NotFound, null];
      }
    }

    const readIssueDto: ReadIssueDto = {
      title: issue.title,
      owner: owner.id,
      number: issue.number,
      labels: unwrapIdsFromObjects(labels),
      assignees: unwrapIdsFromObjects(assignees),
      createdTime: issue.createdTime.toJSON(),
      updatedTime: issue.updatedTime.toJSON(),
    };
    return [OperationResult.Success, readIssueDto];
  }
}
