import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [QueryController],
})
export class QueryModule {}
