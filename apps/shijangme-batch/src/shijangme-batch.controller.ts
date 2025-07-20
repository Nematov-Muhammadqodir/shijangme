import { Controller, Get } from '@nestjs/common';
import { ShijangmeBatchService } from './shijangme-batch.service';

@Controller()
export class ShijangmeBatchController {
  constructor(private readonly shijangmeBatchService: ShijangmeBatchService) {}

  @Get()
  getHello(): string {
    return this.shijangmeBatchService.getHello();
  }
}
