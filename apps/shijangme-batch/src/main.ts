import { NestFactory } from '@nestjs/core';
import { ShijangmeBatchModule } from './shijangme-batch.module';

async function bootstrap() {
  const app = await NestFactory.create(ShijangmeBatchModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
