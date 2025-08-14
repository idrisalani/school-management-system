// server/src/services/cacheService.js
const IORedis = require("ioredis").default;
const logger = require("../utils/logger");

/**
 * @typedef {Object} CacheOptions
 * @property {number} [ttl] - Time to live in seconds
 * @property {boolean} [skipError] - Skip error logging
 * @property {boolean} [skipExpiry] - Skip expiry (persist data)
 */

/**
 * @typedef {Object} CacheService
 * @property {(key: string, options?: CacheOptions) => Promise<any>} get
 * @property {(key: string, value: any, options?: CacheOptions) => Promise<boolean>} set
 * @property {(key: string, options?: CacheOptions) => Promise<boolean>} delete
 * @property {(pattern: string, options?: CacheOptions) => Promise<string[]>} keys
 * @property {(hash: string, field: string, value: any, options?: CacheOptions) => Promise<boolean>} hset
 * @property {(hash: string, field: string, options?: CacheOptions) => Promise<any>} hget
 * @property {(hash: string, field: string, options?: CacheOptions) => Promise<boolean>} hdel
 * @property {(hash: string, options?: CacheOptions) => Promise<Object>} hgetall
 * @property {(hash: string, fields: Object, options?: CacheOptions) => Promise<boolean>} hmset
 * @property {() => Promise<void>} close
 * @property {() => Promise<object>} healthCheck
 */

class CacheServiceImpl {
  /** @type {import('ioredis').Redis} */
  #redis;
  /** @type {number} */
  #defaultTTL;

  constructor() {
    this.#defaultTTL = 3600; // 1 hour default TTL
    this.initialize();
  }

  initialize() {
    try {
      this.#redis = new IORedis({
        host: process.env.REDIS_HOST || "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: Number(process.env.REDIS_DB) || 0,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = "READONLY";
          return err.message.includes(targetError);
        },
      });

      this.#redis.on("connect", () => {
        logger.info("Redis connected successfully");
      });

      this.#redis.on("error", (error) => {
        logger.error("Redis error:", error);
      });
    } catch (error) {
      logger.error("Redis initialization error:", error);
      throw error;
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @param {CacheOptions} [options] - Cache options
   * @returns {Promise<any>} Cached value
   */
  async get(key, options = {}) {
    try {
      const value = await this.#redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      if (!options.skipError) {
        logger.error("Cache get error:", { key, error });
      }
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {CacheOptions} [options] - Cache options
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, options = {}) {
    try {
      const serializedValue = JSON.stringify(value);
      if (options.skipExpiry) {
        await this.#redis.set(key, serializedValue);
      } else {
        const ttl = options.ttl || this.#defaultTTL;
        await this.#redis.set(key, serializedValue, "EX", ttl);
      }
      return true;
    } catch (error) {
      if (!options.skipError) {
        logger.error("Cache set error:", { key, error });
      }
      return false;
    }
  }

  /**
   * Get all keys matching pattern
   * @param {string} pattern - Key pattern to match
   * @param {CacheOptions} [options] - Cache options
   * @returns {Promise<string[]>} Matching keys
   */
  async keys(pattern, options = {}) {
    try {
      return await this.#redis.keys(pattern);
    } catch (error) {
      if (!options.skipError) {
        logger.error("Cache keys error:", { pattern, error });
      }
      return [];
    }
  }

  /**
   * Set hash field
   * @param {string} hash - Hash name
   * @param {string} field - Field name
   * @param {any} value - Value to set
   * @param {CacheOptions} [options] - Cache options
   * @returns {Promise<boolean>} Success status
   */
  async hset(hash, field, value, options = {}) {
    try {
      await this.#redis.hset(hash, field, JSON.stringify(value));
      if (!options.skipExpiry) {
        await this.#redis.expire(hash, options.ttl || this.#defaultTTL);
      }
      return true;
    } catch (error) {
      if (!options.skipError) {
        logger.error("Cache hset error:", { hash, field, error });
      }
      return false;
    }
  }

  /**
   * Get hash field
   * @param {string} hash - Hash name
   * @param {string} field - Field name
   * @param {CacheOptions} [options] - Cache options
   * @returns {Promise<any>} Field value
   */
  async hget(hash, field, options = {}) {
    try {
      const value = await this.#redis.hget(hash, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      if (!options.skipError) {
        logger.error("Cache hget error:", { hash, field, error });
      }
      return null;
    }
  }

  /**
   * Delete hash field
   * @param {string} hash - Hash name
   * @param {string} field - Field name
   * @param {CacheOptions} [options] - Cache options
   * @returns {Promise<boolean>} Success status
   */
  async hdel(hash, field, options = {}) {
    try {
      const result = await this.#redis.hdel(hash, field);
      return result === 1;
    } catch (error) {
      if (!options.skipError) {
        logger.error("Cache hdel error:", { hash, field, error });
      }
      return false;
    }
  }

  /**
   * Close Redis connection
   * @returns {Promise<void>}
   */
  async close() {
    try {
      await this.#redis.quit();
      logger.info("Redis connection closed gracefully");
    } catch (error) {
      logger.error("Error closing Redis connection:", error);
      throw error;
    }
  }

  /**
   * Get cache health status
   * @returns {Promise<object>} Health status
   */
  async healthCheck() {
    try {
      const info = await this.#redis.info();
      return {
        status: this.#redis.status === "ready" ? "healthy" : "unhealthy",
        connected: this.#redis.status === "ready",
        info: this.parseRedisInfo(info),
      };
    } catch (error) {
      logger.error("Cache health check error:", error);
      return {
        status: "unhealthy",
        error: error.message,
      };
    }
  }

  /**
   * Parse Redis info string
   * @private
   * @param {string} info - Redis info string
   * @returns {object} Parsed info
   */
  parseRedisInfo(info) {
    return info
      .split("\n")
      .filter((line) => line && !line.startsWith("#"))
      .reduce((acc, line) => {
        const [key, value] = line.split(":");
        if (key && value) {
          acc[key.trim()] = value.trim();
        }
        return acc;
      }, {});
  }

  /**
   * Delete key from cache
   * @param {string} key - Cache key
   * @param {CacheOptions} [options] - Cache options
   * @returns {Promise<boolean>} Success status
   */
  async delete(key, options = {}) {
    try {
      const result = await this.#redis.del(key);
      return result === 1;
    } catch (error) {
      if (!options.skipError) {
        logger.error("Cache delete error:", { key, error });
      }
      return false;
    }
  }

  /**
   * Get all hash fields and values
   * @param {string} hash - Hash name
   * @param {CacheOptions} [options] - Cache options
   * @returns {Promise<Object>} Hash fields and values
   */
  async hgetall(hash, options = {}) {
    try {
      const result = await this.#redis.hgetall(hash);
      if (!result) return {};

      return Object.entries(result).reduce(
        (acc, [field, value]) => ({
          ...acc,
          [field]: JSON.parse(value),
        }),
        {}
      );
    } catch (error) {
      if (!options.skipError) {
        logger.error("Cache hgetall error:", { hash, error });
      }
      return {};
    }
  }

  /**
   * Set multiple hash fields
   * @param {string} hash - Hash name
   * @param {Object} fields - Field-value pairs
   * @param {CacheOptions} [options] - Cache options
   * @returns {Promise<boolean>} Success status
   */
  async hmset(hash, fields, options = {}) {
    try {
      const serializedFields = Object.entries(fields).reduce(
        (acc, [field, value]) => ({
          ...acc,
          [field]: JSON.stringify(value),
        }),
        {}
      );

      await this.#redis.hmset(hash, serializedFields);

      if (!options.skipExpiry) {
        await this.#redis.expire(hash, options.ttl || this.#defaultTTL);
      }

      return true;
    } catch (error) {
      if (!options.skipError) {
        logger.error("Cache hmset error:", { hash, error });
      }
      return false;
    }
  }
}

/** @type {CacheService} */
const cacheService = new CacheServiceImpl();

// Handle process termination
process.on("SIGTERM", async () => {
  await cacheService.close();
});

module.exports = cacheService;
