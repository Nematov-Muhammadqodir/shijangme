import { createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { Model } from 'mongoose';
import { productTools } from './product-tools';
import { fridgeTools } from './fridge-tools';
import { billTools } from './bill-tools';
import { purchaseTools } from './purchase-tools';
import { loanTools } from './loan-tools';
import { orderTools } from './order-tools';
import { presetTools } from './preset-tools';
import { analyticsTools } from './analytics-tools';

export interface VendorModels {
  productModel: Model<any>;
  fridgeModel: Model<any>;
  billModel: Model<any>;
  purchaseModel: Model<any>;
  loanModel: Model<any>;
  borrowRequestModel: Model<any>;
  orderModel: Model<any>;
  orderItemModel: Model<any>;
  presetModel: Model<any>;
}

export function buildVendorMcpServer(models: VendorModels, memberId: string) {
  const allTools = [
    ...productTools(models.productModel, memberId),
    ...fridgeTools(models.fridgeModel, memberId),
    ...billTools(models.billModel, memberId),
    ...purchaseTools(models.purchaseModel, memberId),
    ...loanTools(models.loanModel, models.borrowRequestModel, memberId),
    ...orderTools(models.orderModel, models.orderItemModel, models.productModel, memberId),
    ...presetTools(models.presetModel, memberId),
    ...analyticsTools(models.productModel, models.billModel, models.purchaseModel, models.fridgeModel, models.loanModel, memberId),
  ];

  const server = createSdkMcpServer({
    name: 'vendor-ai-agent',
    version: '1.0.0',
    tools: allTools as any,
  });

  return server;
}
