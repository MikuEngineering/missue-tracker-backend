import { Controller, Post, Body, Param , Response, HttpStatus, Patch, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { UsersService } from './users.service';
import { Permission } from './users.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { ValidationPipe } from '../common/pipes/validation.pipe'
import { IdValidationPipe } from '../common/pipes/id-validation.pipe';
import { SessionUser } from '../common/types/session-user.type';

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

  @UseGuards(AuthenticatedGuard)
  @Patch(':id')
  async updateProfile(
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
    @Param('id', IdValidationPipe) userId: number,
    @Request() request: ExpressRequest,
  ) {
    const user: SessionUser = request.user as SessionUser;

    if (user.id !== userId && user.permission !== Permission.Admin) {
      throw new ForbiddenException()
    }

    const result = await this.usersService.updateProfile(updateProfileDto, userId);
    if (!result) {
      throw new NotFoundException();
    }
  }
}
