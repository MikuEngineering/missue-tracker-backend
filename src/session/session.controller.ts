import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { LoginGuard } from '../common/guards/login.guard';

@Controller('session')
export class SessionController {
    @UseGuards(LoginGuard)
    @Post()
    async login(@Request() req) {
        return req.user
    }
}
