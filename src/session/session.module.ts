import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionSerializer } from './session.serializer';

@Module({
  controllers: [SessionController],
  providers: [SessionSerializer],
  exports: [SessionSerializer]
})
export class SessionModule {}
