import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { Model } from 'mongoose';

export function presetTools(presetModel: Model<any>, memberId: string) {
  return [
    tool(
      'query_presets',
      'Query vendor\'s preset products (purchase templates). ' +
        'Fields: productName, productCollection, unit, defaultUnitCost, defaultQuantity, ' +
        'productPrice, productOriginPrice, productDesc, productOrigin, sortOrder.',
      {
        filter: z.string().optional().describe('JSON string of MongoDB filter. memberId is auto-set.'),
        limit: z.number().optional().describe('Max results (default 20)'),
      },
      async (args) => {
        try {
          const filter = safeParseJson(args.filter, {});
          filter.memberId = memberId;
          const results = await presetModel.find(filter).sort({ sortOrder: 1, productName: 1 }).limit(args.limit ?? 20).lean();
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
