import { Schema } from 'mongoose';
import {
  ProductCollection,
  ProductFrom,
  ProductStatus,
  ProductVolume,
} from '../libs/enums/product.enum';

const ProductSchema = new Schema(
  {
    productCollection: {
      type: String,
      enum: ProductCollection,
      required: true,
    },
    productStatus: {
      type: String,
      enum: ProductStatus,
      default: ProductStatus.ACTIVE,
    },
    productName: {
      type: String,
      required: true,
    },

    productPrice: {
      type: Number,
      required: true,
    },

    productOriginPrice: {
      type: Number,
      required: true,
    },

    productDiscountRate: {
      type: Number,
      default: 0,
    },

    productSoldCount: {
      type: Number,
      default: 0,
    },

    productOrigin: {
      type: String,
      enum: ProductFrom,
      default: ProductFrom.KOREA,
    },

    productLeftCount: {
      type: Number,
      required: true,
    },

    productVolume: {
      type: Number,
      enum: ProductVolume,
      default: ProductVolume.ZERO,
    },
    productDesc: {
      type: String,
    },
    productImages: {
      type: [String],
      default: [],
    },
    productViews: {
      type: Number,
      default: 0,
    },
    productLikes: {
      type: Number,
      default: 0,
    },

    productComments: {
      type: Number,
      default: 0,
    },

    productRank: {
      type: Number,
      default: 0,
    },
    productOwnerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Member',
    },
  },
  { timestamps: true },
);

export default ProductSchema;
