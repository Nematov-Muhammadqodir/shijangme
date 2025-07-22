import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { Product, Products } from '../../libs/dto/product/product';
import {
  OrdinaryInquery,
  ProductInput,
  ProductsInquiry,
} from '../../libs/dto/product/product.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { ProductService } from './product.service';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { ProductUpdate } from '../../libs/dto/product/product.update';
import { AuthGuard } from '../auth/guards/auth.guard';

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

  @UseGuards(WithoutGuard)
  @Query((returns) => Product)
  public async getProduct(
    @Args('productId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Product> {
    console.log('Query getProduct');

    const productId = shapeIntoMongoObjectId(input);
    return await this.productService.getProduct(memberId, productId);
  }

  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => Product)
  public async updateProduct(
    @Args('input') input: ProductUpdate,
    @AuthMember('_id') productOwnerId: ObjectId,
  ): Promise<Product> {
    console.log('Mutation updateProduct');
    input._id = shapeIntoMongoObjectId(input._id);
    return await this.productService.updateProduct(productOwnerId, input);
  }

  @Query(() => Products)
  public async getProducts(
    @Args('input') input: ProductsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Products> {
    console.log('Query getProducts');
    if (input?.search?.productOwnerId)
      input.search.productOwnerId = shapeIntoMongoObjectId(
        input?.search?.productOwnerId,
      );
    return await this.productService.getProducts(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query(() => Products)
  public async getFavorites(
    @Args('input') input: OrdinaryInquery,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Products> {
    console.log('Query getFavorites');
    return await this.productService.getFavorites(memberId, input);
  }
}
