import { Controller, Get, Query } from '@nestjs/common';
import { QueryProjectDto } from './dto/query-project.dto';
import { ProjectsService } from '../projects/projects.service';

@Controller('query')
export class QueryController {
  constructor(
    private readonly projectsService: ProjectsService,
  ) { }

  @Get('projects')
  async queryProject(@Query() queryProjectDto: QueryProjectDto) {
    const name: string | undefined = queryProjectDto.name;
    let projectIds: number[] = [];
    if (typeof name === 'string') {
      projectIds = await this.projectsService.searchManyByName(name);
    }
    return { projects: projectIds };
  }
}
