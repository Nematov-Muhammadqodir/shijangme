import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BillService } from './bill.service';
import { Bill, Bills } from '../../libs/dto/bill/bill';
import { BillInput, BillsInquiry } from '../../libs/dto/bill/bill.input';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class BillResolver {
  constructor(private readonly billService: BillService) {}

  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => Bill)
  public async createBill(
    @Args('input') input: BillInput,
    @AuthMember('_id') memberId: ObjectId,
    @AuthMember('memberNick') memberNick: string,
  ): Promise<Bill> {
    console.log('Mutation: createBill');
    input.memberId = memberId;
    input.vendorName = memberNick;
    return await this.billService.createBill(input);
  }

  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Query(() => Bills)
  public async getBills(
    @Args('input') input: BillsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Bills> {
    console.log('Query: getBills');
    return await this.billService.getBills(memberId, input);
  }

  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Query(() => Bill)
  public async getBill(
    @Args('billId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Bill> {
    console.log('Query: getBill');
    const billId = shapeIntoMongoObjectId(input);
    return await this.billService.getBill(memberId, billId);
  }

  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => Bill)
  public async deleteBill(
    @Args('billId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Bill> {
    console.log('Mutation: deleteBill');
    const billId = shapeIntoMongoObjectId(input);
    return await this.billService.deleteBill(memberId, billId);
  }
}
