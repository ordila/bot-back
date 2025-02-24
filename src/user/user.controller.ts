import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';

import { UserService } from './user.service';
import { AuthGuard } from 'src/common/guards/firebase-auth.guard';
import { AuthRequest } from 'src/common/types/auth.types';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async getProfile(@Req() req: AuthRequest) {
    const user = await this.userService.getUserByFirebaseUid(req.user.uid);
    return { user };
  }

  @UseGuards(AuthGuard)
  @Patch('openai-key')
  async updateOpenAIKey(
    @Req() req: AuthRequest,
    @Body() body: { openai_api_key: string | null },
  ) {
    console.log(body);
    return this.userService.updateOpenAIKey(req.user.uid, body.openai_api_key);
  }
}
