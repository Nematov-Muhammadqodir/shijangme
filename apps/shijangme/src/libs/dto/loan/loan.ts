import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { LoanStatus } from '../../enums/loan.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class LoanItem {
  @Field(() => String)
  productName: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => String)
  unit: string;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  totalPrice: number;

  @Field(() => Date)
  approvedAt: Date;
}

@ObjectType()
export class Loan {
  @Field(() => String)
  _id: ObjectId;

  @Field(() => String)
  lenderId: ObjectId;

  @Field(() => String)
  borrowerId: ObjectId;

  @Field(() => String)
  loanDate: string;

  @Field(() => LoanStatus)
  status: LoanStatus;

  @Field(() => [LoanItem])
  items: LoanItem[];

  @Field(() => Float)
  totalAmount: number;

  @Field(() => Date, { nullable: true })
  paidAt?: Date;

  @Field(() => String, { nullable: true })
  memo?: string;

  @Field(() => Member, { nullable: true })
  lenderData?: Member;

  @Field(() => Member, { nullable: true })
  borrowerData?: Member;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class Loans {
  @Field(() => [Loan])
  list: Loan[];

  @Field(() => [TotalCounter], { nullable: true })
  metaCounter?: TotalCounter[];
}
