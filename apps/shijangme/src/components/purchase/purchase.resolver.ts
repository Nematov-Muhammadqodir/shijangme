import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { Purchase, Purchases, PurchaseSummary } from '../../libs/dto/purchase/purchase';
import {
  PurchaseInput,
  PurchasesInquiry,
  PurchaseSummaryInput,
} from '../../libs/dto/purchase/purchase.input';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';

@Resolver()
export class PurchaseResolver {
  constructor(private readonly purchaseService: PurchaseService) {}

  /** Record a new purchase (also updates fridge stock) */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => Purchase)
  public async createPurchase(
    @Args('input') input: PurchaseInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Purchase> {
    console.log('Mutation: createPurchase');
    input.memberId = memberId;
    return await this.purchaseService.createPurchase(input);
  }

  /** Get purchase history (filterable by date range + product name) */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Query(() => Purchases)
  public async getPurchases(
    @Args('input') input: PurchasesInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Purchases> {
    console.log('Query: getPurchases');
    return await this.purchaseService.getPurchases(memberId, input);
  }

  /** Get aggregated summary (total by product within date range) */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Query(() => PurchaseSummary)
  public async getPurchaseSummary(
    @Args('input') input: PurchaseSummaryInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PurchaseSummary> {
    console.log('Query: getPurchaseSummary');
    return await this.purchaseService.getPurchaseSummary(memberId, input);
  }
}
