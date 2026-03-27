import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { Model } from 'mongoose';

export function billTools(billModel: Model<any>, memberId: string) {
  return [
    tool(
      'query_bills',
      'Query the vendor\'s bills (sales records). ' +
        'Fields: vendorName, customerName, items (array of {productName, quantity, unit, unitPrice, totalPrice}), ' +
        'totalAmount, billStatus (ACTIVE, DELETE), memo, createdAt, updatedAt.',
      {
        filter: z.string().optional().describe('JSON string of MongoDB filter. memberId is auto-set.'),
        sort: z.string().optional().describe('JSON string of MongoDB sort'),
        limit: z.number().optional().describe('Max results (default 10)'),
      },
      async (args) => {
        try {
          const filter = safeParseJson(args.filter, {});
          const sort = safeParseJson(args.sort, { createdAt: -1 });
          filter.memberId = memberId;
          const results = await billModel.find(filter).sort(sort).limit(args.limit ?? 10).lean();
          return { content: [{ type: 'text' as const, text: JSON.stringify(results) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${err}` }], isError: true };
        }
      },
    ),

    tool(
      'aggregate_bills',
      'Run aggregation on vendor\'s bills for revenue summaries, top customers, sales trends. A $match with memberId and ACTIVE status is auto-prepended.',
      {
        pipeline: z.string().describe('JSON string of aggregation pipeline stages array'),
      },
      async (args) => {
        try {
          const pipeline = safeParseJson(args.pipeline, []);
          pipeline.unshift({ $match: { memberId, billStatus: 'ACTIVE' } });
          const results = await billModel.aggregate(pipeline);
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
