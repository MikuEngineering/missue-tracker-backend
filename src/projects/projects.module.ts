import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './projects.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { TagsModule } from '../tags/tags.module';
import { UsersModule } from '../users/users.module';
import { LabelsModule } from '../labels/labels.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    UsersModule,
    TagsModule,
    LabelsModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
