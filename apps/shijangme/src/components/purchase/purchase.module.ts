import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import PurchaseSchema from '../../schemas/Purchase.model';
import FridgeItemSchema from '../../schemas/Fridge.model';
import ProductSchema from '../../schemas/Product.model';
import PresetProductSchema from '../../schemas/PresetProduct.model';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { PurchaseResolver } from './purchase.resolver';
import { PurchaseService } from './purchase.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Purchase', schema: PurchaseSchema },
      { name: 'FridgeItem', schema: FridgeItemSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'PresetProduct', schema: PresetProductSchema },
    ]),
    AuthModule,
    MemberModule,
  ],
  providers: [PurchaseResolver, PurchaseService],
  exports: [PurchaseService],
})
export class PurchaseModule {}
