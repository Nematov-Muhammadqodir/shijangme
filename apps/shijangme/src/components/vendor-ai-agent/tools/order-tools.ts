import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { Model } from 'mongoose';

export function orderTools(orderModel: Model<any>, orderItemModel: Model<any>, productModel: Model<any>, memberId: string) {
  return [
    tool(
      'query_orders_for_my_products',
      'Query customer orders containing this vendor\'s products. Returns orders with relevant order items.',
      {
        order_status: z.string().optional().describe('Filter by order status: PAUSE, PROCESS, FINISH, DELETE'),
        limit: z.number().optional().describe('Max results (default 10)'),
      },
      async (args) => {
        try {
          const products = await productModel.find({ productOwnerId: memberId }, { _id: 1 }).lean();
          const productIds = products.map((p: any) => p._id);
          if (productIds.length === 0)
            return { content: [{ type: 'text' as const, text: JSON.stringify({ message: 'No products found', orders: [] }) }] };

          const orderItems = await orderItemModel.find({ productId: { $in: productIds } }).lean();
          const orderIds = [...new Set(orderItems.map((oi: any) => oi.orderId.toString()))];
          if (orderIds.length === 0)
            return { content: [{ type: 'text' as const, text: JSON.stringify({ message: 'No orders found', orders: [] }) }] };

          const orderFilter: any = { _id: { $in: orderIds } };
          if (args.order_status) orderFilter.orderStatus = args.order_status;

          const orders = await orderModel.find(orderFilter).sort({ createdAt: -1 }).limit(args.limit ?? 10)
            .populate('memberId', 'memberNick memberFullName').lean();

          const result = orders.map((order: any) => ({
            ...order,
            vendorItems: orderItems.filter((oi: any) => oi.orderId.toString() === order._id.toString()),
          }));
          return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${err}` }], isError: true };
        }
      },
    ),
  ];
}
