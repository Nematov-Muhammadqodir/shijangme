import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { Model } from 'mongoose';

export function fridgeTools(fridgeModel: Model<any>, memberId: string) {
  return [
    tool(
      'query_fridge',
      'Query the vendor\'s fridge (inventory/stock). ' +
        'Fields: productName, productCollection, itemStatus (ACTIVE, FINISHED, DELETE), currentStock, unit, memo, createdAt, updatedAt.',
      {
        filter: z.string().optional().describe('JSON string of MongoDB filter. memberId is auto-set.'),
        sort: z.string().optional().describe('JSON string of MongoDB sort'),
        limit: z.number().optional().describe('Max results (default 20)'),
      },
      async (args) => {
        try {
          const filter = safeParseJson(args.filter, {});
          const sort = safeParseJson(args.sort, {});
          filter.memberId = memberId;
          const results = await fridgeModel.find(filter).sort(sort).limit(args.limit ?? 20).lean();
          return { content: [{ type: 'text' as const, text: JSON.stringify(results) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${err}` }], isError: true };
        }
      },
    ),

    tool(
      'get_low_stock_items',
      'Get fridge items running low on stock. Useful for restock alerts.',
      {
        threshold: z.number().optional().describe('Stock threshold to consider "low" (default 5)'),
      },
      async (args) => {
        try {
          const threshold = args.threshold ?? 5;
          const items = await fridgeModel
            .find({ memberId, itemStatus: 'ACTIVE', currentStock: { $gt: 0, $lte: threshold } })
            .sort({ currentStock: 1 }).lean();
          return { content: [{ type: 'text' as const, text: JSON.stringify({ threshold, count: items.length, items }) }] };
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
