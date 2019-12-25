import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from './issues.entity';
import { IssuesService } from './issues.service';
import { CommentsModule } from '../comments/comments.module';
import { NotifierModule } from '../notifier/notifier.module';
import { UsersModule } from '../users/users.module';
import { IssuesController } from './issues.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue]),
    UsersModule,
    CommentsModule,
    NotifierModule,
  ],
  providers: [IssuesService],
  exports: [IssuesService],
  controllers: [IssuesController],
})
export class IssuesModule {}
