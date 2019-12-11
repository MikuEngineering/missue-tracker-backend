import { Controller, Post, Delete, UseGuards, Request } from '@nestjs/common';
import { LoginGuard } from '../common/guards/login.guard';

@Controller('session')
export class SessionController {
  @UseGuards(LoginGuard)
  @Post()
  async login(@Request() req) {
    return req.user
  }

  @Delete()
  async logout(@Request() req) {
    req.logout();
  }
}
