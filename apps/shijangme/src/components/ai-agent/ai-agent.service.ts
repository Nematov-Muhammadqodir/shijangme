import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  GoogleGenerativeAI,
  SchemaType,
  Tool as GeminiTool,
  Content,
} from '@google/generative-ai';

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private genAI: GoogleGenerativeAI;

  private readonly geminiTools: GeminiTool[] = [
    {
      functionDeclarations: [
        {
          name: 'query_products',
          description:
            'Query the products collection. Use this to find products by price, origin, collection, status, name, etc. ' +
            'Fields: productName, productPrice, productOriginPrice, productDiscountRate, productSoldCount, ' +
            'productOrigin (KOREA, CHINA, SEOUL, ULSAN, DAEGU, BUSAN, US, JEJU, TAILAND, TAIWAN, MIRYANG), ' +
            'productCollection (FRUITS, MASHROOMS, GREENS, VEGETABLES, HERBS, NUTS, GRAINS, MEAT_EGGS, MILK_BEVARAGES), ' +
            'productStatus (ACTIVE, SOLD, DELETE), productLeftCount, productVolume, productDesc, productImages, ' +
            'productViews, productLikes, productComments, productRank, productOwnerId, createdAt, updatedAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: {
                type: SchemaType.STRING,
                description:
                  'JSON string of MongoDB filter query (e.g. {"productOrigin": "CHINA"} or {"productPrice": {"$gte": 100}})',
              },
              sort: {
                type: SchemaType.STRING,
                description:
                  'JSON string of MongoDB sort (e.g. {"productPrice": -1} for most expensive first, {"createdAt": -1} for newest)',
              },
              limit: {
                type: SchemaType.NUMBER,
                description: 'Max number of results to return (default 10)',
              },
              projection: {
                type: SchemaType.STRING,
                description:
                  'JSON string of fields to include/exclude (e.g. {"productName": 1, "productPrice": 1})',
              },
            },
          },
        },
        {
          name: 'query_members',
          description:
            'Query the members collection. Use this to find users/vendors/admins. ' +
            'Fields: memberType (USER, ADMIN, VENDOR), memberStatus (ACTIVE, BLOCK, DELETE), memberAuthType (PHONE, EMAIL, TELEGRAM), ' +
            'memberPhone, memberNick, memberFullName, memberImage, memberAddress, memberDesc, ' +
            'memberProducts, memberArticles, memberFollowers, memberFollowings, memberPoints, ' +
            'memberLikes, memberViews, memberComments, memberRank, memberWarnings, memberBlocks, createdAt, updatedAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB filter query',
              },
              sort: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB sort',
              },
              limit: {
                type: SchemaType.NUMBER,
                description: 'Max results (default 10)',
              },
              projection: {
                type: SchemaType.STRING,
                description: 'JSON string of fields to include/exclude',
              },
            },
          },
        },
        {
          name: 'query_orders',
          description:
            'Query the orders collection. ' +
            'Fields: orderTotal, orderDelivery, orderStatus (PAUSE, PROCESS, FINISH, DELETE), memberId, createdAt, updatedAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB filter query',
              },
              sort: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB sort',
              },
              limit: {
                type: SchemaType.NUMBER,
                description: 'Max results (default 10)',
              },
              projection: {
                type: SchemaType.STRING,
                description: 'JSON string of fields to include/exclude',
              },
            },
          },
        },
        {
          name: 'query_order_items',
          description:
            'Query order items. Each item links an order to a product with quantity and price. ' +
            'Fields: itemQuantity, itemPrice, orderId, productId, createdAt, updatedAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB filter query',
              },
              sort: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB sort',
              },
              limit: {
                type: SchemaType.NUMBER,
                description: 'Max results (default 10)',
              },
              projection: {
                type: SchemaType.STRING,
                description: 'JSON string of fields to include/exclude',
              },
            },
          },
        },
        {
          name: 'query_board_articles',
          description:
            'Query board articles (community posts). ' +
            'Fields: articleCategory (FREE, RECOMMEND, NEWS, HUMOR), articleStatus (ACTIVE, DELETE), ' +
            'articleTitle, articleContent, articleImage, articleLikes, articleViews, articleComments, memberId, createdAt, updatedAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB filter query',
              },
              sort: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB sort',
              },
              limit: {
                type: SchemaType.NUMBER,
                description: 'Max results (default 10)',
              },
              projection: {
                type: SchemaType.STRING,
                description: 'JSON string of fields to include/exclude',
              },
            },
          },
        },
        {
          name: 'query_comments',
          description:
            'Query comments on products or articles. ' +
            'Fields: commentStatus (ACTIVE, DELETE), commentGroup (MEMBER, ARTICLE, PRODUCT), ' +
            'commentContent, commentRefId, memberId, createdAt, updatedAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB filter query',
              },
              sort: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB sort',
              },
              limit: {
                type: SchemaType.NUMBER,
                description: 'Max results (default 10)',
              },
              projection: {
                type: SchemaType.STRING,
                description: 'JSON string of fields to include/exclude',
              },
            },
          },
        },
        {
          name: 'query_notices',
          description:
            'Query system notices. ' +
            'Fields: noticeCategory (FAQ, TERMS, INQUIRY), noticeStatus (HOLD, ACTIVE, DELETE), ' +
            'noticeFor (PRODUCT, PAYMENT, FOR_BUYERS, COMMUNITY, OTHER), noticeTitle, noticeContent, memberId, createdAt, updatedAt.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              filter: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB filter query',
              },
              sort: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB sort',
              },
              limit: {
                type: SchemaType.NUMBER,
                description: 'Max results (default 10)',
              },
              projection: {
                type: SchemaType.STRING,
                description: 'JSON string of fields to include/exclude',
              },
            },
          },
        },
        {
          name: 'count_documents',
          description:
            'Count documents in any collection. Useful for statistics like "how many products from China?" or "how many active users?".',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              collection: {
                type: SchemaType.STRING,
                description:
                  'Which collection to count: products, members, orders, orderItems, boardArticles, comments, notices',
              },
              filter: {
                type: SchemaType.STRING,
                description: 'JSON string of MongoDB filter query',
              },
            },
            required: ['collection'],
          },
        },
        {
          name: 'aggregate_products',
          description:
            'Run MongoDB aggregation pipeline on products. Use for advanced queries like grouping by origin, ' +
            'calculating average prices, finding top sellers, etc.',
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              pipeline: {
                type: SchemaType.STRING,
                description:
                  'JSON string of MongoDB aggregation pipeline stages array',
              },
            },
            required: ['pipeline'],
          },
        },
      ],
    },
  ];

  constructor(
    @InjectModel('Product') private readonly productModel: Model<any>,
    @InjectModel('Member') private readonly memberModel: Model<any>,
    @InjectModel('Order') private readonly orderModel: Model<any>,
    @InjectModel('OrderItem') private readonly orderItemModel: Model<any>,
    @InjectModel('BoardArticle') private readonly boardArticleModel: Model<any>,
    @InjectModel('Comment') private readonly commentModel: Model<any>,
    @InjectModel('Notice') private readonly noticeModel: Model<any>,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  private getModelForCollection(collection: string): Model<any> {
    const map: Record<string, Model<any>> = {
      products: this.productModel,
      members: this.memberModel,
      orders: this.orderModel,
      orderItems: this.orderItemModel,
      boardArticles: this.boardArticleModel,
      comments: this.commentModel,
      notices: this.noticeModel,
    };
    return map[collection];
  }

  private safeParseJson(value: any, fallback: any = {}): any {
    if (typeof value === 'object' && value !== null) return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }

  private async executeTool(
    name: string,
    args: Record<string, any>,
  ): Promise<any> {
    const filter = this.safeParseJson(args.filter, {});
    const sort = this.safeParseJson(args.sort, {});
    const limit = args.limit ?? 10;
    const projection = this.safeParseJson(args.projection, {});
    const pipeline = this.safeParseJson(args.pipeline, []);
    const collection = args.collection;

    try {
      switch (name) {
        case 'query_products':
          return await this.productModel
            .find(filter, projection)
            .sort(sort)
            .limit(limit)
            .lean();
        case 'query_members':
          return await this.memberModel
            .find(filter, projection)
            .sort(sort)
            .limit(limit)
            .lean();
        case 'query_orders':
          return await this.orderModel
            .find(filter, projection)
            .sort(sort)
            .limit(limit)
            .lean();
        case 'query_order_items':
          return await this.orderItemModel
            .find(filter, projection)
            .sort(sort)
            .limit(limit)
            .lean();
        case 'query_board_articles':
          return await this.boardArticleModel
            .find(filter, projection)
            .sort(sort)
            .limit(limit)
            .lean();
        case 'query_comments':
          return await this.commentModel
            .find(filter, projection)
            .sort(sort)
            .limit(limit)
            .lean();
        case 'query_notices':
          return await this.noticeModel
            .find(filter, projection)
            .sort(sort)
            .limit(limit)
            .lean();
        case 'count_documents': {
          const model = this.getModelForCollection(collection);
          const count = await model.countDocuments(filter);
          return { collection, filter, count };
        }
        case 'aggregate_products':
          return await this.productModel.aggregate(pipeline);
        default:
          return { error: `Unknown tool: ${name}` };
      }
    } catch (error) {
      this.logger.error(`Tool execution error [${name}]:`, error);
      return { error: error.message };
    }
  }

  async askAgent(question: string): Promise<string> {
    const systemPrompt = `You are a helpful AI assistant for the Shijangme e-commerce platform database.
You have access to tools that let you query the MongoDB database to answer user questions.

The platform sells agricultural products (fruits, mushrooms, greens, vegetables, herbs, nuts, grains, meat/eggs, milk/beverages).

Key information:
- Prices are stored as numbers in productPrice (selling price) and productOriginPrice (original price)
- Product origins include: KOREA, CHINA, SEOUL, ULSAN, DAEGU, BUSAN, US, JEJU, TAILAND, TAIWAN, MIRYANG
- Product collections: FRUITS, MASHROOMS, GREENS, VEGETABLES, HERBS, NUTS, GRAINS, MEAT_EGGS, MILK_BEVARAGES
- Member types: USER, ADMIN, VENDOR
- Order statuses: PAUSE, PROCESS, FINISH, DELETE

When answering:
- Use the appropriate query tools to fetch real data from the database
- Be specific and include relevant details from the results
- Format numbers nicely (e.g., currency, counts)
- If a query returns no results, say so clearly
- Always answer in the same language the user used to ask the question`;

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      tools: this.geminiTools,
    });

    const chat = model.startChat();
    let response = await chat.sendMessage(question);

    // Agentic loop: keep processing function calls until Gemini gives a text response
    while (true) {
      const candidate = response.response.candidates?.[0];
      if (!candidate) break;

      const functionCalls = candidate.content.parts.filter(
        (part) => part.functionCall,
      );

      if (functionCalls.length === 0) break;

      const functionResponses: Content = {
        role: 'function' as const,
        parts: [],
      };

      for (const part of functionCalls) {
        const { name, args } = part.functionCall;
        this.logger.log(
          `Calling tool: ${name} with args: ${JSON.stringify(args)}`,
        );

        const result = await this.executeTool(name, args);
        functionResponses.parts.push({
          functionResponse: {
            name,
            response: { result },
          },
        });
      }

      response = await chat.sendMessage(functionResponses.parts);
    }

    return response.response.text();
  }
}
