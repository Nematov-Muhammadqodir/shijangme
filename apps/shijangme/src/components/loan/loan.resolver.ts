import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LoanService } from './loan.service';
import { Loan, Loans } from '../../libs/dto/loan/loan';
import { LoansInquiry } from '../../libs/dto/loan/loan.input';
import {
  BorrowRequest,
  BorrowRequests,
} from '../../libs/dto/borrow-request/borrow-request';
import {
  BorrowRequestInput,
  BorrowRequestsInquiry,
} from '../../libs/dto/borrow-request/borrow-request.input';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { ChatGateway } from '../chat/chat.gateway';

@Resolver()
export class LoanResolver {
  constructor(
    private readonly loanService: LoanService,
    private readonly chatGateway: ChatGateway,
  ) {}

  /** Send a borrow request to another vendor */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => BorrowRequest)
  public async createBorrowRequest(
    @Args('input') input: BorrowRequestInput,
    @AuthMember('_id') memberId: ObjectId,
    @AuthMember('memberNick') memberNick: string,
  ): Promise<BorrowRequest> {
    console.log('Mutation: createBorrowRequest');
    input.requesterId = memberId;
    const result = await this.loanService.createBorrowRequest(input);

    // Notify the target vendor
    this.chatGateway.sendNotification(
      input.targetVendorId.toString(),
      'newBorrowRequest',
      {
        requesterName: memberNick,
        productName: input.productName,
        quantity: input.quantity,
        unit: input.unit,
      },
    );

    return result;
  }

  /** Approve a borrow request (I am the lender) */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => BorrowRequest)
  public async approveBorrowRequest(
    @Args('requestId') requestId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<BorrowRequest> {
    console.log('Mutation: approveBorrowRequest');
    const id = shapeIntoMongoObjectId(requestId);
    const result = await this.loanService.approveBorrowRequest(memberId, id);

    // Notify the requester that their request was approved
    this.chatGateway.sendNotification(
      result.requesterId.toString(),
      'borrowRequestUpdate',
      { status: 'APPROVED', productName: result.productName },
    );

    return result;
  }

  /** Reject a borrow request */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => BorrowRequest)
  public async rejectBorrowRequest(
    @Args('requestId') requestId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<BorrowRequest> {
    console.log('Mutation: rejectBorrowRequest');
    const id = shapeIntoMongoObjectId(requestId);
    const result = await this.loanService.rejectBorrowRequest(memberId, id);

    // Notify the requester that their request was rejected
    this.chatGateway.sendNotification(
      result.requesterId.toString(),
      'borrowRequestUpdate',
      { status: 'REJECTED', productName: result.productName },
    );

    return result;
  }

  /** Mark a loan as paid (lender only) */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Mutation(() => Loan)
  public async markLoanPaid(
    @Args('loanId') loanId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Loan> {
    console.log('Mutation: markLoanPaid');
    const id = shapeIntoMongoObjectId(loanId);
    return await this.loanService.markLoanPaid(memberId, id);
  }

  /** Get pending borrow requests sent TO me */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Query(() => BorrowRequests)
  public async getIncomingRequests(
    @Args('input') input: BorrowRequestsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<BorrowRequests> {
    console.log('Query: getIncomingRequests');
    return await this.loanService.getIncomingRequests(memberId, input);
  }

  /** Get borrow requests sent BY me */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Query(() => BorrowRequests)
  public async getMyRequests(
    @Args('input') input: BorrowRequestsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<BorrowRequests> {
    console.log('Query: getMyRequests');
    return await this.loanService.getMyRequests(memberId, input);
  }

  /** Get loans where I am the borrower */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Query(() => Loans)
  public async getMyLoans(
    @Args('input') input: LoansInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Loans> {
    console.log('Query: getMyLoans');
    return await this.loanService.getMyLoans(memberId, input);
  }

  /** Get loans where I am the lender */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Query(() => Loans)
  public async getGivenLoans(
    @Args('input') input: LoansInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Loans> {
    console.log('Query: getGivenLoans');
    return await this.loanService.getGivenLoans(memberId, input);
  }

  /** Get single loan detail */
  @Roles(MemberType.VENDOR)
  @UseGuards(RolesGuard)
  @Query(() => Loan)
  public async getLoan(
    @Args('loanId') loanId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Loan> {
    console.log('Query: getLoan');
    const id = shapeIntoMongoObjectId(loanId);
    return await this.loanService.getLoan(memberId, id);
  }
}
