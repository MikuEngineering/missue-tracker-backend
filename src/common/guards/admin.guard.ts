import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { SessionUser } from '../types/session-user.type';
import { Permission } from '../../users/users.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as SessionUser;

    if (user.permission !== Permission.Admin) {
      throw new ForbiddenException();
    }

    return true;
  }
}
