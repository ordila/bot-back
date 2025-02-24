import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { restartActiveBots } from './lib/botManager/botManager';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await restartActiveBots();

  const port = process.env.PORT || 10000;
  await app.listen(port, '0.0.0.0', () => {
    console.log(`Сервер запущено на порті ${port}`);
  });
}
bootstrap();
