import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, Status } from './issues.entity'
import { CreateIssueDto } from './dto/create-issue.dto';
import { ReadIssueDto } from './dto/read-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { Privacy } from '../projects/projects.entity';
import { Resource } from '../common/types/resource.type';
import { CommentsService } from '../comments/comments.service';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { Permission } from '../users/users.entity';
import { OperationResult } from '../common/types/operation-result.type';

import { User } from '../users/users.entity';

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

  async updateOneById(
    issueId: number,
    updateIssueDto: UpdateIssueDto,
    userId: number,
    permission: Permission,
  ): Promise<[OperationResult, Resource]>
  {
    const issue = await this.issueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.project', 'project')
      .leftJoinAndSelect('issue.owner', 'owner')
      .leftJoinAndSelect('project.participants', 'participants')
      .leftJoinAndSelect('project.labels', 'labels')
      .where('issue.id = :issueId', { issueId })
      .select(['issue', 'project.id', 'owner.id', 'participants.id', 'labels.id'])
      .getOne();

    if (!issue) {
      return [OperationResult.NotFound, Resource.Issue];
    }

    // Check permissions.
    const { project, owner } = issue;
    const { participants, labels } = project;
    const isOwner = owner.id === userId;
    const isParticipant = participants.some(user => user.id === userId);
    const isAdmin = permission === Permission.Admin;
    if (!isOwner && !isParticipant && !isAdmin) {
      return [OperationResult.Forbidden, Resource.Issue];
    }

    // Check if every assignee is a participant of this project.
    const participantIds = participants.map(user => user.id);
    const areAllAssigneesParticipants =
      updateIssueDto.assignees.every(id => participantIds.includes(id));
    if (!areAllAssigneesParticipants) {
      return [OperationResult.Forbidden, Resource.User];
    }

    // Check if every label belongs to this project.
    const labelIds = labels.map(label => label.id);
    const areAllLabelsOfProject =
      updateIssueDto.labels.every(id => labelIds.includes(id));
    if (!areAllLabelsOfProject){
      return [OperationResult.Forbidden, Resource.Label];
    }

    // Delete the old labels and assignees first.
    await Promise.all([
      this.issueRepository
        .query('DELETE FROM issue_labels_label WHERE issueId = ?;', [issueId]),
      this.issueRepository
        .query('DELETE FROM user_assigned_issues_issue WHERE issueId = ?;', [issueId]),
    ]);

    // Insert the new labels and assignees.
    await Promise.all([
      this.issueRepository.update({ id: issueId }, { title: updateIssueDto.title }),
      this.issueRepository
        .query(
          'INSERT INTO issue_labels_label (issueId, labelId) VALUES ?;',
          [updateIssueDto.labels.map(labelId => [issueId, labelId])],
        ),
      this.issueRepository
        .query(
          'INSERT INTO user_assigned_issues_issue (issueId, userId) VALUES ?;',
          [updateIssueDto.assignees.map(userId => [issueId, userId])],
        ),
    ]);

    return [OperationResult.Success, Resource.Issue];
  }

  async closeOneById(
    issueId: number,
    userId: number,
    permission: Permission,
  ): Promise<OperationResult>
  {
    const issue = await this.issueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.owner', 'owner')
      .leftJoinAndSelect('issue.project', 'project')
      .leftJoinAndSelect('project.participants', 'participant')
      .where('issue.id = :issueId', { issueId })
      .select(['issue.id', 'project.id', 'owner.id', 'participant.id'])
      .getOne();

    if (!issue) {
      return OperationResult.NotFound;
    }

    const { owner, project } = issue;
    const isOwner = owner.id === userId;
    const isParticipant = project.participants.some(user => user.id === userId);
    const isAdmin = permission === Permission.Admin;
    if (!isOwner && !isParticipant && !isAdmin) {
      return OperationResult.Forbidden;
    }

    await this.issueRepository.update({ id: issueId }, {
      status: Status.Closed,
    });

    return OperationResult.Success;
  }
}
