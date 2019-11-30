import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/users.entity';
import { UsersModule } from './users/users.module';

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
      entities: [User],
      synchronize: true,
    }),
    UsersModule,
  ],
})
export class AppModule {}
