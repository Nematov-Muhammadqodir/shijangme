import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorAiAgentService } from './vendor-ai-agent.service';
import { VendorAiAgentResolver } from './vendor-ai-agent.resolver';
import ProductSchema from '../../schemas/Product.model';
import FridgeItemSchema from '../../schemas/Fridge.model';
import BillSchema from '../../schemas/Bill.model';
import PurchaseSchema from '../../schemas/Purchase.model';
import LoanSchema from '../../schemas/Loan.model';
import BorrowRequestSchema from '../../schemas/BorrowRequest.model';
import OrderSchema from '../../schemas/Order.model';
import OrderItemSchema from '../../schemas/OrderItem.model';
import PresetProductSchema from '../../schemas/PresetProduct.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'Product', schema: ProductSchema },
      { name: 'FridgeItem', schema: FridgeItemSchema },
      { name: 'Bill', schema: BillSchema },
      { name: 'Purchase', schema: PurchaseSchema },
      { name: 'Loan', schema: LoanSchema },
      { name: 'BorrowRequest', schema: BorrowRequestSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'OrderItem', schema: OrderItemSchema },
      { name: 'PresetProduct', schema: PresetProductSchema },
    ]),
  ],
  providers: [VendorAiAgentService, VendorAiAgentResolver],
})
export class VendorAiAgentModule {}
