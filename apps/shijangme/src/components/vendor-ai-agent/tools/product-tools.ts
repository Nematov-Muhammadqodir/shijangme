import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { Model } from 'mongoose';

export function productTools(productModel: Model<any>, memberId: string) {
  return [
    tool(
      'query_my_products',
      'Query the vendor\'s own products. ' +
        'Fields: productName, productPrice, productOriginPrice, productDiscountRate, productSoldCount, ' +
        'productOrigin (KOREA, CHINA, SEOUL, ULSAN, DAEGU, BUSAN, US, JEJU, TAILAND, TAIWAN, MIRYANG), ' +
        'productCollection (FRUITS, MASHROOMS, GREENS, VEGETABLES, HERBS, NUTS, GRAINS, MEAT_EGGS, MILK_BEVARAGES), ' +
        'productStatus (ACTIVE, SOLD, DELETE), productLeftCount, productVolume, productDesc, ' +
        'productViews, productLikes, productComments, productRank, createdAt, updatedAt. ' +
        'productOwnerId is automatically scoped to the current vendor.',
      {
        filter: z.string().optional().describe('JSON string of MongoDB filter. productOwnerId is auto-set.'),
        sort: z.string().optional().describe('JSON string of MongoDB sort (e.g. {"productPrice": -1})'),
        limit: z.number().optional().describe('Max results (default 10)'),
        projection: z.string().optional().describe('JSON string of fields to include/exclude'),
      },
      async (args) => {
        try {
          const filter = safeParseJson(args.filter, {});
          const sort = safeParseJson(args.sort, {});
          const projection = safeParseJson(args.projection, {});
          filter.productOwnerId = memberId;
          const results = await productModel.find(filter, projection).sort(sort).limit(args.limit ?? 10).lean();
          return { content: [{ type: 'text' as const, text: JSON.stringify(results) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${err}` }], isError: true };
        }
      },
    ),

    tool(
      'aggregate_my_products',
      'Run MongoDB aggregation on vendor\'s products. For analytics like grouping by collection, avg prices, best sellers. A $match with productOwnerId is auto-prepended.',
      {
        pipeline: z.string().describe('JSON string of aggregation pipeline stages array'),
      },
      async (args) => {
        try {
          const pipeline = safeParseJson(args.pipeline, []);
          pipeline.unshift({ $match: { productOwnerId: memberId } });
          const results = await productModel.aggregate(pipeline);
          return { content: [{ type: 'text' as const, text: JSON.stringify(results) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${err}` }], isError: true };
        }
      },
    ),
  ];
}

function safeParseJson(value: any, fallback: any = {}): any {
  if (typeof value === 'object' && value !== null) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return fallback;
}
