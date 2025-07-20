import { Module } from '@nestjs/common';
import { ShijangmeBatchController } from './shijangme-batch.controller';
import { ShijangmeBatchService } from './shijangme-batch.service';

@Module({
  imports: [],
  controllers: [ShijangmeBatchController],
  providers: [ShijangmeBatchService],
})
export class ShijangmeBatchModule {}
