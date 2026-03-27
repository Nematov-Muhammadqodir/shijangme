import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { Model } from 'mongoose';

export function purchaseTools(purchaseModel: Model<any>, memberId: string) {
  return [
    tool(
      'query_purchases',
      'Query the vendor\'s purchase records (procurement/incoming stock). ' +
        'Fields: purchaseDate, productName, productCollection, quantity, unit, unitCost, totalCost, memo, createdAt, updatedAt.',
      {
        filter: z.string().optional().describe('JSON string of MongoDB filter. memberId is auto-set.'),
        sort: z.string().optional().describe('JSON string of MongoDB sort'),
        limit: z.number().optional().describe('Max results (default 10)'),
      },
      async (args) => {
        try {
          const filter = safeParseJson(args.filter, {});
          const sort = safeParseJson(args.sort, { purchaseDate: -1 });
          filter.memberId = memberId;
          const results = await purchaseModel.find(filter).sort(sort).limit(args.limit ?? 10).lean();
          return { content: [{ type: 'text' as const, text: JSON.stringify(results) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${err}` }], isError: true };
        }
      },
    ),

    tool(
      'get_purchase_summary',
      'Get purchase summary grouped by product. Shows total quantity, cost, avg unit cost per product.',
      {
        start_date: z.string().optional().describe('Start date in ISO format'),
        end_date: z.string().optional().describe('End date in ISO format'),
      },
      async (args) => {
        try {
          const match: any = { memberId };
          if (args.start_date || args.end_date) {
            match.purchaseDate = {};
            if (args.start_date) match.purchaseDate.$gte = new Date(args.start_date);
            if (args.end_date) match.purchaseDate.$lte = new Date(args.end_date);
          }
          const results = await purchaseModel.aggregate([
            { $match: match },
            { $group: { _id: '$productName', totalQuantity: { $sum: '$quantity' }, totalCost: { $sum: '$totalCost' }, avgUnitCost: { $avg: '$unitCost' }, purchaseCount: { $sum: 1 } } },
            { $sort: { totalCost: -1 } },
          ]);
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
