import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PresetProductService } from './preset-product.service';
import { PresetProduct } from '../../libs/dto/preset-product/preset-product';
import {
  PresetProductInput,
  PresetProductUpdate,
} from '../../libs/dto/preset-product/preset-product.input';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class PresetProductResolver {
  constructor(
    private readonly presetProductService: PresetProductService,
  ) {}

  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => PresetProduct)
  public async createPresetProduct(
    @Args('input') input: PresetProductInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PresetProduct> {
    console.log('Mutation: createPresetProduct');
    input.memberId = memberId;
    return await this.presetProductService.createPreset(input);
  }

  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Query(() => [PresetProduct])
  public async getPresetProducts(
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PresetProduct[]> {
    console.log('Query: getPresetProducts');
    return await this.presetProductService.getPresets(memberId);
  }

  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => PresetProduct)
  public async updatePresetProduct(
    @Args('input') input: PresetProductUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PresetProduct> {
    console.log('Mutation: updatePresetProduct');
    return await this.presetProductService.updatePreset(memberId, input);
  }

  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => PresetProduct)
  public async deletePresetProduct(
    @Args('presetId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<PresetProduct> {
    console.log('Mutation: deletePresetProduct');
    const presetId = shapeIntoMongoObjectId(input);
    return await this.presetProductService.deletePreset(memberId, presetId);
  }
}
