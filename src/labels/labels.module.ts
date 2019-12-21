import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Label } from './labels.entity';
import { LabelsService } from './labels.service';

@Module({
  imports: [TypeOrmModule.forFeature([Label])],
  providers: [LabelsService],
  exports: [LabelsService],
})
export class LabelsModule {}
