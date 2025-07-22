import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { Product } from '../../libs/dto/product/product';
import { ProductInput } from '../../libs/dto/product/product.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { ProductService } from './product.service';

@Resolver()
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => Product)
  public async createProduct(
    @Args('input') input: ProductInput,
    @AuthMember('_id') productOwnerId: ObjectId,
  ): Promise<Product> {
    input.productOwnerId = productOwnerId;
    return await this.productService.createProduct(input);
  }
}
