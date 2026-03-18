import { Schema } from 'mongoose';
import { ProductCollection } from '../libs/enums/product.enum';
import { FridgeItemStatus } from '../libs/enums/fridge.enum';

const FridgeItemSchema = new Schema(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Member',
    },

    productName: {
      type: String,
      required: true,
    },

    productCollection: {
      type: String,
      enum: ProductCollection,
      required: true,
    },

    itemStatus: {
      type: String,
      enum: FridgeItemStatus,
      default: FridgeItemStatus.ACTIVE,
    },

    currentStock: {
      type: Number,
      required: true,
      default: 0,
    },

    unit: {
      type: String,
      default: 'kg',
    },

    memo: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

// Compound index: one entry per product name per vendor
FridgeItemSchema.index({ memberId: 1, productName: 1 }, { unique: true });

export default FridgeItemSchema;
