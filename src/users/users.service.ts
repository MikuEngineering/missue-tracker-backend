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

    async register(registerUserDto: RegisterUserDto) {
        const username: string = registerUserDto.username;
        const password: string = registerUserDto.password;

        const user = await this.userRepository.create({
            username,
            password,
            nickname: username,
        });
        await this.userRepository.save(user);
    }
}
