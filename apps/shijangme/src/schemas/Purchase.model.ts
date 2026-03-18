import { Schema } from 'mongoose';

const PurchaseSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Member',
    },

    purchaseDate: {
      type: Date,
      required: true,
    },

    productName: {
      type: String,
      required: true,
    },

    productCollection: {
      type: String,
      default: '',
    },

    quantity: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      default: 'box',
    },

    unitCost: {
      type: Number,
      default: 0,
    },

    totalCost: {
      type: Number,
      default: 0,
    },

    memo: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

PurchaseSchema.index({ memberId: 1, purchaseDate: -1 });
PurchaseSchema.index({ memberId: 1, productName: 1, purchaseDate: -1 });

export default PurchaseSchema;
