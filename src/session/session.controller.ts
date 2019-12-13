import { Controller, Post, Delete, UseGuards, Request } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { LoginGuard } from '../common/guards/login.guard';

@Controller('session')
export class SessionController {
  @UseGuards(LoginGuard)
  @Post()
  async login() {
  }

  @Delete()
  async logout(@Request() req: ExpressRequest) {
    req.logout();
  }
}
