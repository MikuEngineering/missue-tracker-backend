import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ValidateUserDto } from './dto/validate-user.dto';
import { LoginResult } from '../common/types/login-result.type';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<ValidateUserDto> {
    const [result, user] = await this.authService.validateUser(username, password);

    if (result === LoginResult.Forbidden) {
      throw new ForbiddenException({
        message: 'Cannot log in since this account is banned.',
      });
    }

    if (result === LoginResult.Failure) {
      throw new UnauthorizedException({
        message: 'You username or password is incorrect.',
      });
    }

    return user;
  }
}
