import { Field, Float, InputType, Int } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { BillStatus } from '../../enums/bill.enum';

@InputType()
export class BillItemInput {
  @IsNotEmpty()
  @Field(() => String)
  productName: string;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  quantity: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  unit?: string;

  @IsNotEmpty()
  @Field(() => Float)
  unitPrice: number;

  @IsNotEmpty()
  @Field(() => Float)
  totalPrice: number;
}

@InputType()
export class BillInput {
  @IsNotEmpty()
  @Length(1, 100)
  @Field(() => String)
  customerName: string;

  @IsNotEmpty()
  @Field(() => [BillItemInput])
  @ValidateNested({ each: true })
  @Type(() => BillItemInput)
  items: BillItemInput[];

  @IsNotEmpty()
  @Field(() => Float)
  totalAmount: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  memo?: string;

  memberId?: ObjectId;
  vendorName?: string;
}

@InputType()
class BillSearchInput {
  @IsOptional()
  @Field(() => BillStatus, { nullable: true })
  billStatus?: BillStatus;

  @IsOptional()
  @Field(() => String, { nullable: true })
  customerName?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  startDate?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  endDate?: string;
}

@InputType()
export class BillsInquiry {
  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  page: number;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  limit: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  sort?: string;

  @IsOptional()
  @Field(() => Direction, { nullable: true })
  direction?: Direction;

  @IsNotEmpty()
  @Field(() => BillSearchInput)
  search: BillSearchInput;
}
