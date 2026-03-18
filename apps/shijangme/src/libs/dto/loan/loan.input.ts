import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { LoanStatus } from '../../enums/loan.enum';

@InputType()
class LoanSearchInput {
  @IsOptional()
  @Field(() => LoanStatus, { nullable: true })
  status?: LoanStatus;

  @IsOptional()
  @Field(() => String, { nullable: true })
  startDate?: string;

  @IsOptional()
  @Field(() => String, { nullable: true })
  endDate?: string;
}

@InputType()
export class LoansInquiry {
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
  @Field(() => LoanSearchInput)
  search: LoanSearchInput;
}
