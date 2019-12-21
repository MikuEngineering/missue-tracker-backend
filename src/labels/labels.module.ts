import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Label } from './labels.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Label])],
})
export class LabelsModule {}
