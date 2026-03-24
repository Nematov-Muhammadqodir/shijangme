import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private redisService: RedisService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Get the limit config from the @RateLimit decorator
    const rateLimitConfig = this.reflector.get<{
      limit: number;
      windowSeconds: number;
    }>('rateLimit', context.getHandler());

    // No @RateLimit decorator on this endpoint → allow
    if (!rateLimitConfig) return true;

    const { limit, windowSeconds } = rateLimitConfig;

    // 2. Get user identity (IP for guests, memberId for logged-in users)
    const request = context.getArgByIndex(2).req;
    const memberId = request.body?.authMember?._id;
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const identity = memberId || ip;

    // 3. Build a key unique to this user + endpoint
    const handler = context.getHandler().name;
    const key = `ratelimit:${identity}:${handler}`;

    // 4. Check the count
    const count = await this.redisService.checkRateLimit(key, windowSeconds);

    if (count > limit) {
      throw new HttpException('Too Many Requests. Please slow down.', 429);
    }

    return true;
  }
}
