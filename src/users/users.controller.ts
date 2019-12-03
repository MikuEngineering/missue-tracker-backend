import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register_user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    async register(@Body() registerUserDto: RegisterUserDto) {
        await this.usersService.register(registerUserDto);
    }

}
