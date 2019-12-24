import { Injectable } from '@nestjs/common';
import { verify } from 'argon2';
import { UsersService } from '../users/users.service';
import { Status } from '../users/users.entity';
import { ValidateUserDto } from './dto/validate-user.dto';
import { LoginResult } from '../common/types/login-result.type';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) { }

  async validateUser(username: string, password: string): Promise<[LoginResult, ValidateUserDto | null]> {
    const user = await this.usersService.findOneByUsername(username);

    if (user && user.status === Status.Banned) {
      return [LoginResult.Forbidden, null];
    }

    let matchPassword = false;
    try {
      matchPassword = await verify(user.password, password);
    }
    catch (err) {}

    if (user && matchPassword) {
      const { password, ...result } = user;
      return [LoginResult.Success, result];
    }

    return [LoginResult.Failure, null];
  }
}
