import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import BorrowRequestSchema from '../../schemas/BorrowRequest.model';
import LoanSchema from '../../schemas/Loan.model';
import FridgeItemSchema from '../../schemas/Fridge.model';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { LoanResolver } from './loan.resolver';
import { LoanService } from './loan.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'BorrowRequest', schema: BorrowRequestSchema },
      { name: 'Loan', schema: LoanSchema },
      { name: 'FridgeItem', schema: FridgeItemSchema },
    ]),
    AuthModule,
    ChatModule,
  ],
  providers: [LoanResolver, LoanService],
  exports: [LoanService],
})
export class LoanModule {}
