import { Controller, Post, Body, Response, HttpStatus, Get, Param } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  async register(@Body() registerUserDto: RegisterUserDto, @Response() response: ExpressResponse) {
    const result = await this.usersService.register(registerUserDto);
    if (result) {
      response.status(HttpStatus.CREATED).send();
    }
    response.status(HttpStatus.CONFLICT).send();
  }

  @Get(':id')
  async getProfile(@Param() id: number, @Response() response: ExpressResponse) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      response.status(HttpStatus.NOT_FOUND).send();
    }
    response.status(HttpStatus.OK).send({
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      autobiography: user.autobiography,
      permission: user.permission,
    });
  }
}
