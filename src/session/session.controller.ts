import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('session')
export class SessionController {
    @UseGuards(AuthGuard('local'))
    @Post()
    async login(@Request() req) {
        return req.user
    }
}
