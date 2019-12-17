import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, Status } from './users.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

  async findOneByUsername(username: string): Promise<User> {
    return this.userRepository.findOne({ username });
  }

  async findOne(id: number): Promise<User> {
    return this.userRepository.findOne({ id });
  }

  async updateProfile(updateProfileDto: UpdateProfileDto, userId: number): Promise<boolean> {
    if (!(await this.checkUserExistenceById(userId))) {
      return false;
    }

    await this.userRepository.update({ id: userId }, {
      nickname: updateProfileDto.nickname,
      autobiography: updateProfileDto.autobiography,
    });

    return true;
  }

  async banUserById(userId: number): Promise<boolean> {
    if (!(await this.checkUserExistenceById(userId))) {
      return false;
    }

    await this.userRepository.update({ id: userId }, { status: Status.Banned });
    return true;
  }

  private async checkUserExistenceById(userId: number): Promise<boolean> {
    const count = await this.userRepository.count({ id: userId });
    return count > 0;
  }
}
