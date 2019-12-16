import { Controller, Post, Body, Param , Response, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { ValidationPipe } from '../common/pipes/validation.pipe'
import { IdValidationPipe } from '../common/pipes/id-validation.pipe';

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
    @Param('id', IdValidationPipe) userId: number
  ) {
    await this.usersService.updateProfile(updateProfileDto, userId);
  }
}
