import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import BillSchema from '../../schemas/Bill.model';
import { AuthModule } from '../auth/auth.module';
import { BillResolver } from './bill.resolver';
import { BillService } from './bill.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Bill', schema: BillSchema }]),
    AuthModule,
  ],
  providers: [BillResolver, BillService],
  exports: [BillService],
})
export class BillModule {}
