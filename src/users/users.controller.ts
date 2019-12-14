import { Controller, Post, Body, Response, HttpStatus } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register_user.dto';

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
}
