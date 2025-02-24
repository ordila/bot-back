import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { restartActiveBots } from './lib/botManager/botManager';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await restartActiveBots();
  await app.listen(3001);
}
bootstrap();
