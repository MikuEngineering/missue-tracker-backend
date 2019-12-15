import { Controller, Get, Post, Delete, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { LoginGuard } from '../common/guards/login.guard';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard';

@Controller('session')
export class SessionController {
  @UseGuards(AuthenticatedGuard)
  @Get()
  async checkLogin() { }

  @UseGuards(LoginGuard)
  @Post()
  async login() { }

  @UseGuards(AuthenticatedGuard)
  @Delete()
  async logout(@Request() req: ExpressRequest) {
    req.logout();
  }
}
