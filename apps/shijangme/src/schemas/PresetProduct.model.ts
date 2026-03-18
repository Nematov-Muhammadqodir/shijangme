import { Schema } from 'mongoose';
import { ProductCollection } from '../libs/enums/product.enum';

const PresetProductSchema = new Schema(
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
      default: '',
    },

    unit: {
      type: String,
      default: 'box',
    },

    defaultUnitCost: {
      type: Number,
      default: 0,
    },

    defaultQuantity: {
      type: Number,
      default: 0,
    },

    productImages: {
      type: [String],
      default: [],
    },

    productPrice: {
      type: Number,
      default: 0,
    },

    productOriginPrice: {
      type: Number,
      default: 0,
    },

    productDesc: {
      type: String,
      default: '',
    },

    productOrigin: {
      type: String,
      default: '',
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

PresetProductSchema.index({ memberId: 1, productName: 1 }, { unique: true });

export default PresetProductSchema;
