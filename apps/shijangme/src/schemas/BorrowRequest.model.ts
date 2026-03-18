import { Schema } from 'mongoose';
import { BorrowRequestStatus } from '../libs/enums/loan.enum';

const BorrowRequestSchema = new Schema(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Member',
    },

    targetVendorId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Member',
    },

    productName: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      default: 'box',
    },

    unitPrice: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: BorrowRequestStatus,
      default: BorrowRequestStatus.PENDING,
    },

    loanId: {
      type: Schema.Types.ObjectId,
      ref: 'Loan',
      default: null,
    },

    message: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

BorrowRequestSchema.index({ requesterId: 1, createdAt: -1 });
BorrowRequestSchema.index({ targetVendorId: 1, status: 1 });

export default BorrowRequestSchema;
