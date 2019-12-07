import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionSerializer } from './session.serializer';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [SessionController],
  providers: [SessionSerializer],
  exports: [SessionSerializer]
})
export class SessionModule {}
