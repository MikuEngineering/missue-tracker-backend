import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from './issues.entity';
import { IssuesService } from './issues.service';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [TypeOrmModule.forFeature([Issue]), CommentsModule],
  providers: [IssuesService],
  exports: [IssuesService],
})
export class IssuesModule {}
