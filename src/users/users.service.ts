import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register_user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) { }

  async register(registerUserDto: RegisterUserDto): Promise<boolean> {
    const username: string = registerUserDto.username;
    const password: string = registerUserDto.password;
    const nickname: string = username;

    const user = await this.userRepository.findOne({ username });
    if (user) {
      return false;
    }

    const newUser = await this.userRepository.create({
      username, password, nickname,
    });
    await this.userRepository.save(newUser);

    return true;
  }

  async findOne(username: string): Promise<User | undefined> {
    return this.userRepository.findOne({ username });
  }

  async findOneById(id: number): Promise<User | undefined> {
    return this.userRepository.findOne({ id });
  }
}
