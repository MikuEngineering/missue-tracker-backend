import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from './issues.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Issue])],
})
export class IssuesModule {}
