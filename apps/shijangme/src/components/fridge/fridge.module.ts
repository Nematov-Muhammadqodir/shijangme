import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import FridgeItemSchema from '../../schemas/Fridge.model';
import { AuthModule } from '../auth/auth.module';
import { FridgeResolver } from './fridge.resolver';
import { FridgeService } from './fridge.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'FridgeItem', schema: FridgeItemSchema },
    ]),
    AuthModule,
  ],
  providers: [FridgeResolver, FridgeService],
  exports: [FridgeService],
})
export class FridgeModule {}
