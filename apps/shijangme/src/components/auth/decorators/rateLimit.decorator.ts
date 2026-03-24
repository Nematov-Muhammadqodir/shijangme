import { SetMetadata } from '@nestjs/common';

// Usage: @RateLimit(10, 60) → 10 requests per 60 seconds
export const RateLimit = (limit: number, windowSeconds: number) =>
  SetMetadata('rateLimit', { limit, windowSeconds });
