import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FridgeService } from './fridge.service';
import { FridgeItem, FridgeItems } from '../../libs/dto/fridge/fridge';
import {
  FridgeItemInput,
  FridgeItemUpdate,
  FridgeItemsInquiry,
  FridgeRestockInput,
} from '../../libs/dto/fridge/fridge.input';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class FridgeResolver {
  constructor(private readonly fridgeService: FridgeService) {}

  /** Add product to fridge (auto-merges if same name exists) */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => FridgeItem)
  public async addFridgeItem(
    @Args('input') input: FridgeItemInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<FridgeItem> {
    console.log('Mutation: addFridgeItem');
    input.memberId = memberId;
    return await this.fridgeService.addFridgeItem(input);
  }

  /** Restock existing fridge product (auto-creates if not found) */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => FridgeItem)
  public async restockFridgeItem(
    @Args('input') input: FridgeRestockInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<FridgeItem> {
    console.log('Mutation: restockFridgeItem');
    input.memberId = memberId;
    return await this.fridgeService.restockFridgeItem(input);
  }

  /** Update fridge item (adjust stock, change status, add memo) */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => FridgeItem)
  public async updateFridgeItem(
    @Args('input') input: FridgeItemUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<FridgeItem> {
    console.log('Mutation: updateFridgeItem');
    return await this.fridgeService.updateFridgeItem(memberId, input);
  }

  /** Get vendor's fridge items */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Query(() => FridgeItems)
  public async getFridgeItems(
    @Args('input') input: FridgeItemsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<FridgeItems> {
    console.log('Query: getFridgeItems');
    return await this.fridgeService.getFridgeItems(memberId, input);
  }

  /** View another vendor's ACTIVE fridge items */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Query(() => FridgeItems)
  public async getVendorFridge(
    @Args('vendorId') vendorId: string,
    @Args('input') input: FridgeItemsInquiry,
  ): Promise<FridgeItems> {
    console.log('Query: getVendorFridge');
    const targetId = shapeIntoMongoObjectId(vendorId);
    return await this.fridgeService.getVendorFridge(targetId, input);
  }

  /** Soft-delete a fridge item */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => FridgeItem)
  public async deleteFridgeItem(
    @Args('fridgeItemId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<FridgeItem> {
    console.log('Mutation: deleteFridgeItem');
    const fridgeItemId = shapeIntoMongoObjectId(input);
    return await this.fridgeService.deleteFridgeItem(memberId, fridgeItemId);
  }
}
