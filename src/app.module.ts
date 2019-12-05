import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/users.entity';
import { Project } from './projects/projects.entity';
import { Tag } from './tags/tags.entity';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TagsModule } from './tags/tags.module';
import { AuthModule } from './auth/auth.module';
import { SessionModule } from './session/session.module';

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
      entities: [User, Project, Tag],
      synchronize: true,
    }),
    UsersModule,
    ProjectsModule,
    TagsModule,
    AuthModule,
    SessionModule,
  ],
})
export class AppModule {}
