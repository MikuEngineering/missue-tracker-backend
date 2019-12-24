import { Controller, Get, Query, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { QueryProjectDto } from './dto/query-project.dto';
import { QueryIssueDto } from './dto/query-issue.dto';
import { ProjectsService } from '../projects/projects.service';
import { IssuesService } from '../issues/issues.service';
import { Permission } from '../users/users.entity';
import { SessionUser } from '../common/types/session-user.type';

@Controller('query')
export class QueryController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly issuesService: IssuesService,
  ) { }

  @Get('projects')
  async queryProject(
    @Query() queryProjectDto: QueryProjectDto,
    @Request() request: ExpressRequest,
  ) {
    const user: SessionUser | undefined = request.user as SessionUser;
    const userId: number | undefined = user && user.id;
    const permission: Permission | undefined = user && user.permission;
    const name: string | undefined = queryProjectDto.name;
    let projectIds: number[] = [];
    if (typeof name === 'string') {
      projectIds = await this.projectsService.searchManyByName(
        name,
        userId,
        permission,
      );
    }
    return { projects: projectIds };
  }

  @Get('issues')
  async queryIssues(
    @Query() queryIssueDto: QueryIssueDto,
    @Request() request: ExpressRequest,
  ) {
    const user: SessionUser | undefined = request.user as SessionUser;
    const userId: number | undefined = user && user.id;
    const permission: Permission | undefined = user && user.permission;
    const title: string | undefined = queryIssueDto.title;
    let issueIds: number[] = [];
    if (typeof title === 'string') {
      issueIds = await this.issuesService.searchManyByTitle(
        title,
        userId,
        permission,
      );
    }
    return { issues: issueIds };
  }
}
