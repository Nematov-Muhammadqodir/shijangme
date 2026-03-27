import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { Model } from 'mongoose';

export function analyticsTools(
  productModel: Model<any>, billModel: Model<any>, purchaseModel: Model<any>,
  fridgeModel: Model<any>, loanModel: Model<any>, memberId: string,
) {
  return [
    tool(
      'get_vendor_dashboard',
      'Get comprehensive dashboard: product counts, fridge stats, total revenue, purchase costs, open loans.',
      {},
      async () => {
        try {
          const [activeProducts, soldProducts, activeFridge, lowStock, activeBills, totalRevenue, totalPurchaseCost, openLoansGiven, openLoansReceived] = await Promise.all([
            productModel.countDocuments({ productOwnerId: memberId, productStatus: 'ACTIVE' }),
            productModel.countDocuments({ productOwnerId: memberId, productStatus: 'SOLD' }),
            fridgeModel.countDocuments({ memberId, itemStatus: 'ACTIVE' }),
            fridgeModel.countDocuments({ memberId, itemStatus: 'ACTIVE', currentStock: { $gt: 0, $lte: 5 } }),
            billModel.countDocuments({ memberId, billStatus: 'ACTIVE' }),
            billModel.aggregate([{ $match: { memberId, billStatus: 'ACTIVE' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
            purchaseModel.aggregate([{ $match: { memberId } }, { $group: { _id: null, total: { $sum: '$totalCost' } } }]),
            loanModel.countDocuments({ lenderId: memberId, status: 'OPEN' }),
            loanModel.countDocuments({ borrowerId: memberId, status: 'OPEN' }),
          ]);
          return { content: [{ type: 'text' as const, text: JSON.stringify({
            products: { active: activeProducts, sold: soldProducts },
            fridge: { activeItems: activeFridge, lowStockAlerts: lowStock },
            sales: { totalBills: activeBills, totalRevenue: totalRevenue[0]?.total ?? 0 },
            purchases: { totalCost: totalPurchaseCost[0]?.total ?? 0 },
            loans: { givenOpen: openLoansGiven, receivedOpen: openLoansReceived },
          }) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${err}` }], isError: true };
        }
      },
    ),

    tool(
      'get_sales_trend',
      'Get daily or monthly sales trend based on bills.',
      {
        group_by: z.enum(['day', 'month']).describe('Group by "day" or "month"'),
        start_date: z.string().optional().describe('Start date in ISO format'),
        end_date: z.string().optional().describe('End date in ISO format'),
      },
      async (args) => {
        try {
          const match: any = { memberId, billStatus: 'ACTIVE' };
          if (args.start_date || args.end_date) {
            match.createdAt = {};
            if (args.start_date) match.createdAt.$gte = new Date(args.start_date);
            if (args.end_date) match.createdAt.$lte = new Date(args.end_date);
          }
          const fmt = args.group_by === 'day' ? '%Y-%m-%d' : '%Y-%m';
          const results = await billModel.aggregate([
            { $match: match },
            { $group: { _id: { $dateToString: { format: fmt, date: '$createdAt' } }, totalRevenue: { $sum: '$totalAmount' }, billCount: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ]);
          return { content: [{ type: 'text' as const, text: JSON.stringify(results) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${err}` }], isError: true };
        }
      },
    ),

    tool(
      'get_top_customers',
      'Get top customers by total spend from bills.',
      { limit: z.number().optional().describe('Number of top customers (default 10)') },
      async (args) => {
        try {
          const results = await billModel.aggregate([
            { $match: { memberId, billStatus: 'ACTIVE' } },
            { $group: { _id: '$customerName', totalSpent: { $sum: '$totalAmount' }, billCount: { $sum: 1 }, lastPurchase: { $max: '$createdAt' } } },
            { $sort: { totalSpent: -1 } },
            { $limit: args.limit ?? 10 },
          ]);
          return { content: [{ type: 'text' as const, text: JSON.stringify(results) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${err}` }], isError: true };
        }
      },
    ),

    tool(
      'get_top_selling_items',
      'Get top selling items by revenue and quantity across all bills.',
      { limit: z.number().optional().describe('Number of top items (default 10)') },
      async (args) => {
        try {
          const results = await billModel.aggregate([
            { $match: { memberId, billStatus: 'ACTIVE' } },
            { $unwind: '$items' },
            { $group: { _id: '$items.productName', totalQuantity: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.totalPrice' }, avgUnitPrice: { $avg: '$items.unitPrice' }, salesCount: { $sum: 1 } } },
            { $sort: { totalRevenue: -1 } },
            { $limit: args.limit ?? 10 },
          ]);
          return { content: [{ type: 'text' as const, text: JSON.stringify(results) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${err}` }], isError: true };
        }
      },
    ),

    tool(
      'get_profit_analysis',
      'Analyze profit by comparing purchase costs vs sales revenue per product. Shows margin, cost, revenue, profit.',
      {},
      async () => {
        try {
          const [purchaseCosts, salesRevenue] = await Promise.all([
            purchaseModel.aggregate([
              { $match: { memberId } },
              { $group: { _id: '$productName', totalCost: { $sum: '$totalCost' }, totalPurchased: { $sum: '$quantity' } } },
            ]),
            billModel.aggregate([
              { $match: { memberId, billStatus: 'ACTIVE' } },
              { $unwind: '$items' },
              { $group: { _id: '$items.productName', totalRevenue: { $sum: '$items.totalPrice' }, totalSold: { $sum: '$items.quantity' } } },
            ]),
          ]);
          const costMap = new Map(purchaseCosts.map((c: any) => [c._id, c]));
          const revenueMap = new Map(salesRevenue.map((r: any) => [r._id, r]));
          const allProducts = new Set([...costMap.keys(), ...revenueMap.keys()]);
          const analysis = Array.from(allProducts).map((name) => {
            const cost = costMap.get(name); const revenue = revenueMap.get(name);
            const tc = cost?.totalCost ?? 0; const tr = revenue?.totalRevenue ?? 0;
            return { productName: name, totalCost: tc, totalRevenue: tr, profit: tr - tc,
              margin: tr > 0 ? Math.round(((tr - tc) / tr) * 100) : 0,
              totalPurchased: cost?.totalPurchased ?? 0, totalSold: revenue?.totalSold ?? 0 };
          });
          analysis.sort((a, b) => b.profit - a.profit);
          return { content: [{ type: 'text' as const, text: JSON.stringify(analysis) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${err}` }], isError: true };
        }
      },
    ),
  ];
}
