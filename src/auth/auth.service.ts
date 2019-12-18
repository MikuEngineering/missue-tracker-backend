import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { Status } from '../users/users.entity';
import { ValidateUserDto } from './dto/validate-user.dto';
import { LoginResult } from '../common/types/login-result.type';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) { }

  async validateUser(username: string, password: string): Promise<[LoginResult, ValidateUserDto | null]> {
    const user = await this.usersService.findOneByUsername(username);

    if (user.status === Status.Banned) {
      return [LoginResult.Forbidden, null];
    }

    if (user && user.password === password) {
      const { password, ...result } = user;
      return [LoginResult.Success, result];
    }

    return [LoginResult.Failure, null];
  }
}
