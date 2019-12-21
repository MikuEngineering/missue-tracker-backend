import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, Status } from './users.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ReadProfileDto } from './dto/read-profile.dto';
import { OperationResult } from '../common/types/operation-result.type';

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

  async readProfileById(userId: number): Promise<ReadProfileDto | null> {
    const user = await this.findOne(userId);
    if (!user) {
      return null;
    }

    const readProfileDto: ReadProfileDto = new ReadProfileDto();
    readProfileDto.username = user.username;
    readProfileDto.nickname = user.nickname;
    readProfileDto.email = user.email;
    readProfileDto.autobiography = user.autobiography;
    readProfileDto.permission = user.permission;
    readProfileDto.status = user.status;

    return readProfileDto;
  }

  async updateProfile(updateProfileDto: UpdateProfileDto, userId: number): Promise<boolean> {
    if (!(await this.checkUserExistenceById(userId))) {
      return false;
    }

    await this.userRepository.update({ id: userId }, {
      nickname: updateProfileDto.nickname,
      autobiography: updateProfileDto.autobiography,
      email: updateProfileDto.email
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

  async unbanUserById(userId: number): Promise<boolean> {
    if (!(await this.checkUserExistenceById(userId))) {
      return false;
    }

    await this.userRepository.update({ id: userId }, { status: Status.Normal });
    return true;
  }

  async readAllProjectIdsById(userId: number): Promise<[OperationResult, number[]]> {
    const user = await this.userRepository.findOne({ id: userId }, {
      relations: ['participatingProjects']
    });

    if (!user) {
      return [OperationResult.NotFound, null];
    }

    const projectIds = user.participatingProjects.map(project => project.id);

    return [OperationResult.Success, projectIds];
  }

  private async checkUserExistenceById(userId: number): Promise<boolean> {
    const count = await this.userRepository.count({ id: userId });
    return count > 0;
  }
}
