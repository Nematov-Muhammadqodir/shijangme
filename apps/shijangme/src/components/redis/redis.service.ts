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
  private logger = new Logger('RedisService');

  // Called automatically when NestJS starts
  onModuleInit() {
    this.client = new Redis({
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
    });

    this.client.on('connect', () => this.logger.log('Connected to Redis'));
    this.client.on('error', (err) => this.logger.error('Redis error', err));
  }

  // Called automatically when NestJS shuts down
  async onModuleDestroy() {
    await this.client.quit();
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

  // ====== COUNTER OPERATIONS ======

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  // ====== HASH OPERATIONS ======

  // Set multiple fields in a hash
  async hset(key: string, data: Record<string, string | number>): Promise<void> {
    try {
      await this.client.hset(key, data);
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
          cursor, 'MATCH', pattern, 'COUNT', 100,
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

  // Direct access to ioredis client for advanced use
  getClient(): Redis {
    return this.client;
  }
}
