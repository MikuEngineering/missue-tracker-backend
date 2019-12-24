import { Controller, Get, Query, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { QueryProjectDto } from './dto/query-project.dto';
import { ProjectsService } from '../projects/projects.service';
import { Permission } from '../users/users.entity';
import { SessionUser } from '../common/types/session-user.type';

@Controller('query')
export class QueryController {
  constructor(
    private readonly projectsService: ProjectsService,
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
}
