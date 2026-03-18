import { Schema } from 'mongoose';
import { LoanStatus } from '../libs/enums/loan.enum';

const LoanItemSchema = new Schema(
  {
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'box' },
    unitPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    approvedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const LoanSchema = new Schema(
  {
    lenderId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Member',
    },

    borrowerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Member',
    },

    loanDate: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: LoanStatus,
      default: LoanStatus.OPEN,
    },

    items: {
      type: [LoanItemSchema],
      default: [],
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    memo: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

// One loan per borrower-lender pair per day
LoanSchema.index(
  { lenderId: 1, borrowerId: 1, loanDate: 1 },
  { unique: true },
);

export default LoanSchema;
