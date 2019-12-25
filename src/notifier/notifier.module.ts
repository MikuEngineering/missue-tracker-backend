import { Module } from '@nestjs/common';
import { NotifierService } from './notifier.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [NotifierService],
  exports: [NotifierService],
})
export class NotifierModule {}
