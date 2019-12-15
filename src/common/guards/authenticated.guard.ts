import { ExecutionContext, Injectable, CanActivate, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SessionController } from '../../session/session.controller';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (request.isAuthenticated()) {
      return true;
    }

    const classSignature = context.getClass();
    const method = context.getHandler();

    if (classSignature === SessionController && method.name === 'checkLogin') {
      throw new NotFoundException();
    }
    else {
      throw new UnauthorizedException();
    }
  }
}
