import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { Model } from 'mongoose';

export function loanTools(loanModel: Model<any>, borrowRequestModel: Model<any>, memberId: string) {
  return [
    tool(
      'query_loans_given',
      'Query loans where this vendor is the LENDER (owed TO the vendor). ' +
        'Fields: lenderId, borrowerId, loanDate, status (OPEN, PAID, OVERDUE), ' +
        'items (array of {productName, quantity, unit, unitPrice, totalPrice}), totalAmount, paidAt, memo.',
      {
        filter: z.string().optional().describe('JSON string of MongoDB filter. lenderId is auto-set.'),
        sort: z.string().optional().describe('JSON string of MongoDB sort'),
        limit: z.number().optional().describe('Max results (default 10)'),
      },
      async (args) => {
        try {
          const filter = safeParseJson(args.filter, {});
          const sort = safeParseJson(args.sort, { createdAt: -1 });
          filter.lenderId = memberId;
          const results = await loanModel.find(filter).sort(sort).limit(args.limit ?? 10)
            .populate('borrowerId', 'memberNick memberFullName').lean();
          return { content: [{ type: 'text' as const, text: JSON.stringify(results) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${err}` }], isError: true };
        }
      },
    ),

    tool(
      'query_loans_received',
      'Query loans where this vendor is the BORROWER (vendor OWES to others). Same fields. borrowerId is auto-set.',
      {
        filter: z.string().optional().describe('JSON string of MongoDB filter'),
        sort: z.string().optional().describe('JSON string of MongoDB sort'),
        limit: z.number().optional().describe('Max results (default 10)'),
      },
      async (args) => {
        try {
          const filter = safeParseJson(args.filter, {});
          const sort = safeParseJson(args.sort, { createdAt: -1 });
          filter.borrowerId = memberId;
          const results = await loanModel.find(filter).sort(sort).limit(args.limit ?? 10)
            .populate('lenderId', 'memberNick memberFullName').lean();
          return { content: [{ type: 'text' as const, text: JSON.stringify(results) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${err}` }], isError: true };
        }
      },
    ),

    tool(
      'query_incoming_borrow_requests',
      'Query borrow requests FROM other vendors TO this vendor. ' +
        'Fields: requesterId, productName, quantity, unit, unitPrice, status (PENDING, APPROVED, REJECTED), message.',
      {
        filter: z.string().optional().describe('JSON string of MongoDB filter. targetVendorId is auto-set.'),
        sort: z.string().optional().describe('JSON string of MongoDB sort'),
        limit: z.number().optional().describe('Max results (default 10)'),
      },
      async (args) => {
        try {
          const filter = safeParseJson(args.filter, {});
          const sort = safeParseJson(args.sort, { createdAt: -1 });
          filter.targetVendorId = memberId;
          const results = await borrowRequestModel.find(filter).sort(sort).limit(args.limit ?? 10)
            .populate('requesterId', 'memberNick memberFullName').lean();
          return { content: [{ type: 'text' as const, text: JSON.stringify(results) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${err}` }], isError: true };
        }
      },
    ),

    tool(
      'query_my_borrow_requests',
      'Query borrow requests made BY this vendor to other vendors. requesterId is auto-set.',
      {
        filter: z.string().optional().describe('JSON string of MongoDB filter'),
        sort: z.string().optional().describe('JSON string of MongoDB sort'),
        limit: z.number().optional().describe('Max results (default 10)'),
      },
      async (args) => {
        try {
          const filter = safeParseJson(args.filter, {});
          const sort = safeParseJson(args.sort, { createdAt: -1 });
          filter.requesterId = memberId;
          const results = await borrowRequestModel.find(filter).sort(sort).limit(args.limit ?? 10)
            .populate('targetVendorId', 'memberNick memberFullName').lean();
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
