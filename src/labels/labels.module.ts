import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Label } from './labels.entity';
import { LabelsService } from './labels.service';
import { LabelsController } from './labels.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [TypeOrmModule.forFeature([Label])],
  providers: [LabelsService],
  exports: [LabelsService],
  controllers: [LabelsController],
})
export class LabelsModule {}
