import { Controller, Post, Req, UseGuards, Body } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthGuard } from 'src/common/guards/firebase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard)
  @Post('register')
  async register(@Req() req, @Body() body) {
    return this.authService.registerUser(body.email, body.firebaseUid);
  }

  @UseGuards(AuthGuard)
  @Post('login')
  async login(@Req() req) {
    return this.authService.findUser(req.user.uid);
  }
}
