import { ExecutionContext, Injectable, CanActivate, NotFoundException, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (request.isAuthenticated()) {
      return true;
    }

    const classSignature = context.getClass();
    const method = context.getHandler();

    if (classSignature.name === 'SessionController' && method.name === 'checkLogin') {
      throw new NotFoundException({
        message: 'You are not logged in.',
      });
    }
    else {
      throw new UnauthorizedException({
        message: 'You are not logged in.',
      });
    }
  }
}
