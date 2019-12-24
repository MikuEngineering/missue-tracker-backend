import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { ProjectsModule } from '../projects/projects.module';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [ProjectsModule, IssuesModule],
  controllers: [QueryController],
})
export class QueryModule {}
