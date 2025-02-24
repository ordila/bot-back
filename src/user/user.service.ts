import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { OpenAIService } from 'src/lib/openAi/openai';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserByFirebaseUid(firebaseUid: string) {
    return this.prisma.user.findUnique({
      where: { firebaseUid },
    });
  }

  async updateOpenAIKey(firebaseUid: string, openai_api_key: string | null) {
    if (openai_api_key) {
      const isValid = await OpenAIService.validateApiKey(openai_api_key);

      if (!isValid) {
        throw new BadRequestException('Невірний OpenAI API Key');
      }
    }

    return this.prisma.user.update({
      where: { firebaseUid },
      data: { openai_api_key },
    });
  }
}
