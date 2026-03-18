import { Schema } from 'mongoose';
import { BillStatus } from '../libs/enums/bill.enum';

const BillItemSchema = new Schema(
  {
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { _id: false },
);

const BillSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Member',
    },

    vendorName: {
      type: String,
      required: true,
    },

    customerName: {
      type: String,
      required: true,
    },

    items: {
      type: [BillItemSchema],
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    billStatus: {
      type: String,
      enum: BillStatus,
      default: BillStatus.ACTIVE,
    },

    memo: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

BillSchema.index({ memberId: 1, createdAt: -1 });

export default BillSchema;
