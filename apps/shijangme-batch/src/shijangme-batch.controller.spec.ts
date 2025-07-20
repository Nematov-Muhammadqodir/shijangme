import { Test, TestingModule } from '@nestjs/testing';
import { ShijangmeBatchController } from './shijangme-batch.controller';
import { ShijangmeBatchService } from './shijangme-batch.service';

describe('ShijangmeBatchController', () => {
  let shijangmeBatchController: ShijangmeBatchController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ShijangmeBatchController],
      providers: [ShijangmeBatchService],
    }).compile();

    shijangmeBatchController = app.get<ShijangmeBatchController>(ShijangmeBatchController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(shijangmeBatchController.getHello()).toBe('Hello World!');
    });
  });
});
