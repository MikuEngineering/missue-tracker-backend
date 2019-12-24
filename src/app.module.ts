import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/users.entity';
import { Project } from './projects/projects.entity';
import { Tag } from './tags/tags.entity';
import { Label } from './labels/labels.entity';
import { Issue } from './issues/issues.entity';
import { Comment } from './comments/comments.entity';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TagsModule } from './tags/tags.module';
import { AuthModule } from './auth/auth.module';
import { SessionModule } from './session/session.module';
import { LabelsModule } from './labels/labels.module';
import { IssuesModule } from './issues/issues.module';
import { CommentsModule } from './comments/comments.module';
import { QueryModule } from './query/query.module';

const {
  DB_HOST,
  DB_USERNAME,
  DB_PASSWORD,
  DB_DATABASE,
} = process.env;

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: DB_HOST,
      port: 3306,
      username: DB_USERNAME,
      password: DB_PASSWORD,
      database: DB_DATABASE,
      entities: [
        User,
        Project,
        Tag,
        Label,
        Issue,
        Comment,
      ],
      synchronize: true,
    }),
    UsersModule,
    ProjectsModule,
    TagsModule,
    AuthModule,
    SessionModule,
    LabelsModule,
    IssuesModule,
    CommentsModule,
    QueryModule,
  ],
})
export class AppModule {}
