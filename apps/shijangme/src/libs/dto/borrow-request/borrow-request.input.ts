import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { BorrowRequestStatus } from '../../enums/loan.enum';

@InputType()
export class BorrowRequestInput {
  @IsNotEmpty()
  @Field(() => String)
  targetVendorId: string;

  @IsNotEmpty()
  @Length(2, 100)
  @Field(() => String)
  productName: string;

  @IsNotEmpty()
  @Min(1)
  @Field(() => Int)
  quantity: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  unit?: string;

  @IsOptional()
  @Field(() => Float, { nullable: true })
  unitPrice?: number;

  @IsOptional()
  @Field(() => String, { nullable: true })
  message?: string;

  requesterId?: ObjectId;
}

@InputType()
class BorrowRequestSearchInput {
  @IsOptional()
  @Field(() => BorrowRequestStatus, { nullable: true })
  status?: BorrowRequestStatus;
}

@InputType()
export class BorrowRequestsInquiry {
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
  @Field(() => BorrowRequestSearchInput)
  search: BorrowRequestSearchInput;
}
