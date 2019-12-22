import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from './issues.entity';
import { IssuesService } from './issues.service';
import { CommentsModule } from '../comments/comments.module';
import { IssuesController } from './issues.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Issue]), CommentsModule],
  providers: [IssuesService],
  exports: [IssuesService],
  controllers: [IssuesController],
})
export class IssuesModule {}
