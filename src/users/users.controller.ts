import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Response,
  Request,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { UsersService } from './users.service';
import { Permission } from './users.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { ValidationPipe } from '../common/pipes/validation.pipe'
import { IdValidationPipe } from '../common/pipes/id-validation.pipe';
import { SessionUser } from '../common/types/session-user.type';
import { OperationResult } from '../common/types/operation-result.type';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  async readUsers(@Query('username') username: string) {
    if (!username) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findOneByUsername(username);
    if (!user) {
      throw new NotFoundException();
    }

    return { id: user.id };
  }

  @Post()
  async register(@Body(ValidationPipe) registerUserDto: RegisterUserDto, @Response() response: ExpressResponse) {
    const result = await this.usersService.register(registerUserDto);
    if (result) {
      response.status(HttpStatus.CREATED).send();
      return;
    }
    response.status(HttpStatus.CONFLICT).send();
  }

  @UseGuards(AuthenticatedGuard)
  @Put(':id')
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

  @Get(':id')
  async getProfile(@Param('id', IdValidationPipe) userId: number) {
    const readProfileDto = await this.usersService.readProfileById(userId);
    if (!readProfileDto) {
      throw new NotFoundException({
        message: 'The user does not exist.',
      });
    }

    return readProfileDto;
  }

  @UseGuards(AuthenticatedGuard, AdminGuard)
  @Post(':id/ban')
  async banUser(@Param('id', IdValidationPipe) userId: number) {
    const result = await this.usersService.banUserById(userId);
    if (!result) {
      throw new NotFoundException();
    }
  }

  @UseGuards(AuthenticatedGuard, AdminGuard)
  @Delete(':id/ban')
  async unbanUser(@Param('id', IdValidationPipe) userId: number, @Response() response: ExpressResponse) {
    const result = await this.usersService.unbanUserById(userId);
    if (!result) {
      throw new NotFoundException();
    }

    response.status(HttpStatus.NO_CONTENT).send();
  }

  @Get(':id/projects')
  async readAllProjects(@Param('id', IdValidationPipe) userId: number) {
    const [result, projectIds] = await this.usersService.readAllProjectIdsById(userId);

    if (result === OperationResult.NotFound) {
      throw new NotFoundException();
    }

    return { projects: projectIds };
  }
}
