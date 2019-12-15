import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ValidateUserDto } from './dto/validate_user.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) { }

  async validateUser(username: string, password: string): Promise<ValidateUserDto | null> {
    const user = await this.usersService.findOneByUsername(username);

    if (user && user.password === password) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }
}
