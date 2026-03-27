import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { buildVendorMcpServer } from './tools/server';

@Injectable()
export class VendorAiAgentService {
  private readonly logger = new Logger(VendorAiAgentService.name);

  constructor(
    @InjectModel('Product') private readonly productModel: Model<any>,
    @InjectModel('FridgeItem') private readonly fridgeModel: Model<any>,
    @InjectModel('Bill') private readonly billModel: Model<any>,
    @InjectModel('Purchase') private readonly purchaseModel: Model<any>,
    @InjectModel('Loan') private readonly loanModel: Model<any>,
    @InjectModel('BorrowRequest')
    private readonly borrowRequestModel: Model<any>,
    @InjectModel('Order') private readonly orderModel: Model<any>,
    @InjectModel('OrderItem') private readonly orderItemModel: Model<any>,
    @InjectModel('PresetProduct') private readonly presetModel: Model<any>,
  ) {}

  private readonly systemPrompt = `You are a smart AI business assistant for a vendor on the Shijangme agricultural marketplace.
You help the vendor manage their business by querying their data and providing actionable insights.

You have access to tools that let you query the vendor's own data:
- Products (marketplace listings), Fridge (inventory/stock), Bills (sales records)
- Purchases (procurement), Loans (given & received), Borrow Requests (incoming & outgoing)
- Orders (customer orders for vendor's products), Preset Products (purchase templates)
- Analytics: dashboard overview, sales trends, top customers, top selling items, profit analysis

Key domain knowledge:
- Product collections: FRUITS, MASHROOMS, GREENS, VEGETABLES, HERBS, NUTS, GRAINS, MEAT_EGGS, MILK_BEVARAGES
- Product origins: KOREA, CHINA, SEOUL, ULSAN, DAEGU, BUSAN, US, JEJU, TAILAND, TAIWAN, MIRYANG
- Product statuses: ACTIVE, SOLD, DELETE | Fridge: ACTIVE, FINISHED, DELETE
- Bill: ACTIVE, DELETE | Loan: OPEN, PAID, OVERDUE | Borrow Request: PENDING, APPROVED, REJECTED
- Order: PAUSE, PROCESS, FINISH, DELETE

When answering:
- All data is automatically scoped to this vendor — you can only see their own data
- Use the appropriate tools to fetch real data before answering
- Be specific and include relevant numbers, names, and details
- Format currency nicely (Korean Won amounts)
- Provide business insights and recommendations when appropriate
- If a query returns no results, say so clearly
- Always answer in the same language the user used to ask the question`;

  async askVendorAgent(memberId: string, question: string): Promise<string> {
    const mcpServer = buildVendorMcpServer(
      {
        productModel: this.productModel,
        fridgeModel: this.fridgeModel,
        billModel: this.billModel,
        purchaseModel: this.purchaseModel,
        loanModel: this.loanModel,
        borrowRequestModel: this.borrowRequestModel,
        orderModel: this.orderModel,
        orderItemModel: this.orderItemModel,
        presetModel: this.presetModel,
      },
      memberId,
    );

    this.logger.log(
      `Vendor AI Agent query from ${memberId}: ${question.slice(0, 100)}`,
    );

    let finalText = '';

    const q = query({
      prompt: question,
      options: {
        systemPrompt: this.systemPrompt,
        maxTurns: 4,
        mcpServers: { 'vendor-ai-agent': mcpServer },
        permissionMode: 'bypassPermissions' as const,
        allowDangerouslySkipPermissions: true,
      },
    });

    for await (const message of q) {
      if (message.type === 'assistant') {
        const content = (message as any).message?.content;
        if (!Array.isArray(content)) continue;

        for (const block of content) {
          if (typeof block !== 'object' || !block) continue;

          if ('type' in block && block.type === 'tool_use') {
            const toolBlock = block as {
              name: string;
              input: Record<string, unknown>;
            };
            this.logger.log(`[Tool Call] ${toolBlock.name}`);
          }

          if ('type' in block && block.type === 'text') {
            const textBlock = block as { text: string };
            if (textBlock.text.trim()) {
              finalText = textBlock.text;
            }
          }
        }
      }

      if (message.type === 'result') {
        const result = message as Record<string, unknown>;
        this.logger.log(
          `[Complete] turns: ${result.num_turns}, cost: $${result.total_cost_usd}`,
        );
      }
    }

    return (
      finalText || 'I was unable to process your request. Please try again.'
    );
  }
}
