import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpStatus,
  HttpCode,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
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
      throw new BadRequestException({
        message: 'The query parameter username is required.',
      });
    }

    const user = await this.usersService.findOneByUsername(username);
    if (!user) {
      throw new NotFoundException({
        message: 'The user does not exist.',
      });
    }

    return { id: user.id };
  }

  @Post()
  async register(@Body(ValidationPipe) registerUserDto: RegisterUserDto) {
    const result = await this.usersService.register(registerUserDto);
    if (!result) {
      throw new ConflictException({
        message: 'The username has already been taken.',
      });
    }
  }

  @UseGuards(AuthenticatedGuard)
  @Put(':id')
  async updateProfile(
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
    @Param('id', IdValidationPipe) userId: number,
    @Request() request: ExpressRequest,
  ) {
    const user: SessionUser = request.user as SessionUser;

    const isProfileOwner = user.id === userId;
    const isAdmin = user.permission === Permission.Admin;
    if (!isProfileOwner && !isAdmin) {
      throw new ForbiddenException({
        message: 'Cannot edit this profile since you are not the owner of it.',
      });
    }

    const result = await this.usersService.updateProfile(updateProfileDto, userId);
    if (!result) {
      throw new NotFoundException({
        message: 'The profile does not exist.',
      });
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
      throw new NotFoundException({
        message: 'The user does not exist.',
      });
    }
  }

  @UseGuards(AuthenticatedGuard, AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/ban')
  async unbanUser(@Param('id', IdValidationPipe) userId: number) {
    const result = await this.usersService.unbanUserById(userId);
    if (!result) {
      throw new NotFoundException({
        message: 'The user does not exist.',
      });
    }
  }

  @Get(':id/projects')
  async readAllProjects(@Param('id', IdValidationPipe) userId: number) {
    const [result, projectIds] = await this.usersService.readAllProjectIdsById(userId);

    if (result === OperationResult.NotFound) {
      throw new NotFoundException({
        message: 'The user does not exist.',
      });
    }

    return { projects: projectIds };
  }

  @Get(':id/issues')
  async readAllIssues(
    @Param('id', IdValidationPipe) targetUserId: number,
    @Request() request: ExpressRequest,
  ) {
    const user: SessionUser | undefined = request.user as SessionUser;
    const userId: number | undefined = user && user.id;
    const permission: Permission | undefined = user && user.permission;
    const [result, issueIds] = await this.usersService.readAllIssues(
      targetUserId,
      userId,
      permission,
    );

    if (result === OperationResult.NotFound) {
      throw new NotFoundException({
        message: 'The user does not exist.',
      });
    }

    return { issues: issueIds };
  }
}
