import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private subscriber: Redis;
  private logger = new Logger('RedisService');

  // Called automatically when NestJS starts
  onModuleInit() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 10) return null;
        return Math.min(times * 200, 5000);
      },
    };

    // Main client for GET, SET, DEL, etc.
    this.client = new Redis(redisConfig);
    this.client.on('connect', () => this.logger.log('Connected to Redis'));
    this.client.on('error', (err) => this.logger.error('Redis error', err));

    // Separate client for subscribing (a subscribed client can't do normal commands)
    this.subscriber = new Redis(redisConfig);
    this.subscriber.on('connect', () =>
      this.logger.log('Redis subscriber connected'),
    );
    this.subscriber.on('error', (err) =>
      this.logger.error('Redis subscriber error', err),
    );
  }

  // Called automatically when NestJS shuts down
  async onModuleDestroy() {
    await this.client.quit();
    await this.subscriber.quit();
  }

  // ====== BASIC OPERATIONS ======

  // Store a value (optionally with TTL in seconds)
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (err) {
      this.logger.warn(`Redis set failed for key "${key}"`, err);
    }
  }

  // Get a value
  async get(key: string): Promise<string | null> {
    try {
      return this.client.get(key);
    } catch (err) {
      this.logger.warn(`Redis get failed for key "${key}"`, err);
      return null;
    }
  }

  // Delete a key
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn(`Redis delete failed for key "${key}"`, err);
      return null;
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  // ====== JSON HELPERS ======

  // Store an object as JSON
  async setJson<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.set(key, JSON.stringify(value), ttl);
    } catch (err) {
      this.logger.warn(`Redis set failed for key "${key}"`, err);
      return null;
    }
  }

  // Get and parse JSON
  async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`Redis read failed for key "${key}"`, err);
      return null;
    }
  }

  // ====== SESSION OPERATIONS ======

  // Create a session for a user (24 hour TTL)
  async createSession(memberId: string): Promise<void> {
    await this.setJson(`session:${memberId}`, { active: true }, 86400);
  }

  // Check if a session exists
  async getSession(memberId: string): Promise<boolean> {
    const session = await this.get(`session:${memberId}`);
    return !!session;
  }

  // Destroy a session (logout or ban)
  async destroySession(memberId: string): Promise<void> {
    await this.del(`session:${memberId}`);
  }

  // ====== COUNTER OPERATIONS ======

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  // ====== RATE LIMITING ======

  // Returns the current count after incrementing. Sets TTL only on first request.
  async checkRateLimit(key: string, ttl: number): Promise<number> {
    try {
      const count = await this.client.incr(key);
      if (count === 1) {
        await this.client.expire(key, ttl);
      }
      return count;
    } catch (err) {
      this.logger.warn(`Redis rate limit check failed for "${key}"`, err);
      return 0; // allow request if Redis is down
    }
  }

  // ====== SORTED SET OPERATIONS ======

  // Increment a member's score in a sorted set
  async zincrby(
    key: string,
    member: string,
    increment: number,
  ): Promise<number> {
    try {
      const score = await this.client.zincrby(key, increment, member);
      return Number(score);
    } catch (err) {
      this.logger.warn(`Redis zincrby failed for "${key}:${member}"`, err);
      return null;
    }
  }

  // Get top N members (highest score first)
  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.zrevrange(key, start, stop);
    } catch (err) {
      this.logger.warn(`Redis zrevrange failed for "${key}"`, err);
      return [];
    }
  }

  // Get top N members WITH their scores
  async zrevrangeWithScores(
    key: string,
    start: number,
    stop: number,
  ): Promise<{ member: string; score: number }[]> {
    try {
      const raw = await this.client.zrevrange(key, start, stop, 'WITHSCORES');
      // Redis returns: ["member1", "score1", "member2", "score2", ...]
      const result = [];
      for (let i = 0; i < raw.length; i += 2) {
        result.push({ member: raw[i], score: Number(raw[i + 1]) });
      }
      return result;
    } catch (err) {
      this.logger.warn(`Redis zrevrangeWithScores failed for "${key}"`, err);
      return [];
    }
  }

  // ====== HASH OPERATIONS ======

  // Set multiple fields in a hash (optionally with TTL)
  async hset(
    key: string,
    data: Record<string, string | number>,
    ttl?: number,
  ): Promise<void> {
    try {
      await this.client.hset(key, data);
      if (ttl) {
        await this.client.expire(key, ttl);
      }
    } catch (err) {
      this.logger.warn(`Redis hset failed for "${key}"`, err);
    }
  }

  // Increment a field in a hash by a number
  async hincrby(key: string, field: string, value: number): Promise<number> {
    try {
      return await this.client.hincrby(key, field, value);
    } catch (err) {
      this.logger.warn(`Redis hincrby failed for "${key}.${field}"`, err);
      return null;
    }
  }

  // Get a single field from a hash
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (err) {
      this.logger.warn(`Redis hget failed for "${key}.${field}"`, err);
      return null;
    }
  }

  // ====== PATTERN OPERATIONS ======

  // Delete all keys matching a pattern (e.g. "product:*")
  async delPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch (err) {
      this.logger.warn(`Redis delPattern failed for "${pattern}"`, err);
    }
  }

  // ====== PUB/SUB ======

  // Publish a message to a channel
  async publish(channel: string, data: any): Promise<void> {
    try {
      await this.client.publish(channel, JSON.stringify(data));
    } catch (err) {
      this.logger.warn(`Redis publish failed on "${channel}"`, err);
    }
  }

  // Subscribe to a channel and handle incoming messages
  async subscribe(
    channel: string,
    callback: (data: any) => void,
  ): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          callback(JSON.parse(message));
        }
      });
      this.logger.log(`Subscribed to channel: ${channel}`);
    } catch (err) {
      this.logger.warn(`Redis subscribe failed on "${channel}"`, err);
    }
  }

  // Direct access to ioredis client for advanced use
  getClient(): Redis {
    return this.client;
  }
}
