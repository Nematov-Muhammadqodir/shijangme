import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
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
import { FridgeItem } from '../../libs/dto/fridge/fridge';
import { BorrowRequestStatus, LoanStatus } from '../../libs/enums/loan.enum';
import { FridgeItemStatus } from '../../libs/enums/fridge.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { lookupMemberGeneral } from '../../libs/config';
import { T } from '../../libs/types/common';

const lookupLender = {
  $lookup: {
    from: 'members',
    localField: 'lenderId',
    foreignField: '_id',
    as: 'lenderData',
  },
};

const lookupBorrower = {
  $lookup: {
    from: 'members',
    localField: 'borrowerId',
    foreignField: '_id',
    as: 'borrowerData',
  },
};

const lookupRequester = {
  $lookup: {
    from: 'members',
    localField: 'requesterId',
    foreignField: '_id',
    as: 'requesterData',
  },
};

const lookupTargetVendor = {
  $lookup: {
    from: 'members',
    localField: 'targetVendorId',
    foreignField: '_id',
    as: 'targetVendorData',
  },
};

@Injectable()
export class LoanService {
  constructor(
    @InjectModel('BorrowRequest')
    private readonly borrowRequestModel: Model<BorrowRequest>,
    @InjectModel('Loan') private readonly loanModel: Model<Loan>,
    @InjectModel('FridgeItem')
    private readonly fridgeItemModel: Model<FridgeItem>,
  ) {}

  /** Create a borrow request — validates stock exists */
  public async createBorrowRequest(
    input: BorrowRequestInput,
  ): Promise<BorrowRequest> {
    try {
      const targetId = input.targetVendorId;

      // Verify stock exists
      const fridgeItem = await this.fridgeItemModel.findOne({
        memberId: targetId,
        productName: { $regex: new RegExp(`^${input.productName}$`, 'i') },
        itemStatus: FridgeItemStatus.ACTIVE,
        currentStock: { $gte: input.quantity },
      });

      if (!fridgeItem) {
        throw new BadRequestException(
          'Insufficient stock or product not found',
        );
      }

      return await this.borrowRequestModel.create({
        ...input,
        unitPrice: input.unitPrice ?? 0,
        unit: input.unit ?? fridgeItem.unit ?? 'box',
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.log('Error createBorrowRequest:', error.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  /** Approve a borrow request — the key business logic */
  public async approveBorrowRequest(
    vendorId: ObjectId,
    requestId: ObjectId,
  ): Promise<BorrowRequest> {
    // 1. Find and validate request
    const request = await this.borrowRequestModel.findOne({
      _id: requestId,
      targetVendorId: vendorId,
      status: BorrowRequestStatus.PENDING,
    });

    if (!request)
      throw new InternalServerErrorException('Request not found or already processed');

    const totalPrice = (request.unitPrice ?? 0) * request.quantity;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const productNameRegex = new RegExp(`^${request.productName}$`, 'i');

    // === STEP 1: Decrement lender (B) stock — MUST succeed first ===
    const decremented = await this.fridgeItemModel.findOneAndUpdate(
      {
        memberId: vendorId,
        productName: { $regex: productNameRegex },
        currentStock: { $gte: request.quantity },
      },
      { $inc: { currentStock: -request.quantity } },
      { new: true },
    );

    if (!decremented) {
      throw new BadRequestException(
        'Insufficient stock. Cannot approve this request.',
      );
    }

    // Auto-set FINISHED if stock hits 0
    if (decremented.currentStock <= 0) {
      decremented.currentStock = 0;
      decremented.itemStatus = FridgeItemStatus.FINISHED;
      await decremented.save();
    }

    // === STEP 2: Increment borrower (A) stock — with rollback on failure ===
    try {
      await this.fridgeItemModel.findOneAndUpdate(
        {
          memberId: request.requesterId,
          productName: { $regex: productNameRegex },
        },
        {
          $inc: { currentStock: request.quantity },
          $set: {
            itemStatus: FridgeItemStatus.ACTIVE,
            unit: request.unit,
          },
          $setOnInsert: {
            memberId: request.requesterId,
            productName: request.productName,
            productCollection: decremented.productCollection ?? '',
          },
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      // ROLLBACK Step 1 — give stock back to lender
      await this.fridgeItemModel.findOneAndUpdate(
        { memberId: vendorId, productName: { $regex: productNameRegex } },
        {
          $inc: { currentStock: request.quantity },
          $set: { itemStatus: FridgeItemStatus.ACTIVE },
        },
      );
      throw new InternalServerErrorException(
        'Failed to update borrower stock. Lender stock restored.',
      );
    }

    // === STEP 3: Find or create today's loan — append item ===
    let loan;
    try {
      loan = await this.loanModel.findOneAndUpdate(
        {
          lenderId: vendorId,
          borrowerId: request.requesterId,
          loanDate: today,
        },
        {
          $push: {
            items: {
              productName: request.productName,
              quantity: request.quantity,
              unit: request.unit,
              unitPrice: request.unitPrice,
              totalPrice,
              approvedAt: new Date(),
            },
          },
          $inc: { totalAmount: totalPrice },
          $setOnInsert: {
            lenderId: vendorId,
            borrowerId: request.requesterId,
            loanDate: today,
            status: LoanStatus.OPEN,
          },
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      // ROLLBACK Steps 1 & 2 — reverse both stock changes
      await this.fridgeItemModel.findOneAndUpdate(
        { memberId: vendorId, productName: { $regex: productNameRegex } },
        {
          $inc: { currentStock: request.quantity },
          $set: { itemStatus: FridgeItemStatus.ACTIVE },
        },
      );
      await this.fridgeItemModel.findOneAndUpdate(
        {
          memberId: request.requesterId,
          productName: { $regex: productNameRegex },
        },
        { $inc: { currentStock: -request.quantity } },
      );
      throw new InternalServerErrorException(
        'Failed to create loan. All stock changes rolled back.',
      );
    }

    // === STEP 4: Update request status ===
    request.status = BorrowRequestStatus.APPROVED;
    request.loanId = loan._id;
    await request.save();

    return request;
  }

  /** Reject a borrow request */
  public async rejectBorrowRequest(
    vendorId: ObjectId,
    requestId: ObjectId,
  ): Promise<BorrowRequest> {
    const request = await this.borrowRequestModel.findOneAndUpdate(
      {
        _id: requestId,
        targetVendorId: vendorId,
        status: BorrowRequestStatus.PENDING,
      },
      { status: BorrowRequestStatus.REJECTED },
      { new: true },
    );

    if (!request)
      throw new InternalServerErrorException('Request not found or already processed');

    return request;
  }

  /** Get incoming borrow requests (I am the lender) */
  public async getIncomingRequests(
    vendorId: ObjectId,
    input: BorrowRequestsInquiry,
  ): Promise<BorrowRequests> {
    const match: T = { targetVendorId: vendorId };

    if (input.search.status) {
      match.status = input.search.status;
    }

    const sort: T = {
      [input.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
    };

    const result = await this.borrowRequestModel.aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupRequester,
            { $unwind: '$requesterData' },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }

  /** Get my outgoing borrow requests (I am the borrower) */
  public async getMyRequests(
    requesterId: ObjectId,
    input: BorrowRequestsInquiry,
  ): Promise<BorrowRequests> {
    const match: T = { requesterId };

    if (input.search.status) {
      match.status = input.search.status;
    }

    const sort: T = {
      [input.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
    };

    const result = await this.borrowRequestModel.aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupTargetVendor,
            { $unwind: '$targetVendorData' },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }

  /** Get loans where I am the borrower */
  public async getMyLoans(
    borrowerId: ObjectId,
    input: LoansInquiry,
  ): Promise<Loans> {
    const match: T = { borrowerId };

    if (input.search.status) {
      match.status = input.search.status;
    }

    if (input.search.startDate || input.search.endDate) {
      match.loanDate = {};
      if (input.search.startDate) match.loanDate.$gte = input.search.startDate;
      if (input.search.endDate) match.loanDate.$lte = input.search.endDate;
    }

    const sort: T = {
      [input.sort ?? 'loanDate']: input?.direction ?? Direction.DESC,
    };

    const result = await this.loanModel.aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupLender,
            { $unwind: '$lenderData' },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }

  /** Get loans where I am the lender */
  public async getGivenLoans(
    lenderId: ObjectId,
    input: LoansInquiry,
  ): Promise<Loans> {
    const match: T = { lenderId };

    if (input.search.status) {
      match.status = input.search.status;
    }

    if (input.search.startDate || input.search.endDate) {
      match.loanDate = {};
      if (input.search.startDate) match.loanDate.$gte = input.search.startDate;
      if (input.search.endDate) match.loanDate.$lte = input.search.endDate;
    }

    const sort: T = {
      [input.sort ?? 'loanDate']: input?.direction ?? Direction.DESC,
    };

    const result = await this.loanModel.aggregate([
      { $match: match },
      { $sort: sort },
      {
        $facet: {
          list: [
            { $skip: (input.page - 1) * input.limit },
            { $limit: input.limit },
            lookupBorrower,
            { $unwind: '$borrowerData' },
          ],
          metaCounter: [{ $count: 'total' }],
        },
      },
    ]);

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }

  /** Mark loan as paid (only lender can mark) */
  public async markLoanPaid(
    vendorId: ObjectId,
    loanId: ObjectId,
  ): Promise<Loan> {
    const result = await this.loanModel.findOneAndUpdate(
      { _id: loanId, lenderId: vendorId, status: LoanStatus.OPEN },
      { status: LoanStatus.PAID, paidAt: new Date() },
      { new: true },
    );

    if (!result)
      throw new InternalServerErrorException('Loan not found or already paid');

    return result;
  }

  /** Get single loan detail */
  public async getLoan(
    vendorId: ObjectId,
    loanId: ObjectId,
  ): Promise<Loan> {
    const result = await this.loanModel.aggregate([
      {
        $match: {
          _id: loanId,
          $or: [{ lenderId: vendorId }, { borrowerId: vendorId }],
        },
      },
      lookupLender,
      { $unwind: '$lenderData' },
      lookupBorrower,
      { $unwind: '$borrowerData' },
    ]);

    if (!result.length)
      throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }
}
