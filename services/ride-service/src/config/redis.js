/**
 * Redis Configuration
 * 
 * This module handles Redis connection for caching,
 * session management, and real-time data like driver locations.
 * 
 * @module config/redis
 */

const { createClient } = require('redis');
const logger = require('../utils/logger');

// Redis configuration from environment variables
const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis max retries reached');
        return new Error('Redis max retries reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
};

// Add password if provided
if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}

// Create Redis client
const client = createClient(redisConfig);

// Track connection state
let isConnected = false;

// Connection event handlers
client.on('connect', () => {
  logger.debug('Redis connecting...');
});

client.on('ready', () => {
  isConnected = true;
  logger.info('Redis connection ready');
});

client.on('error', (err) => {
  logger.error('Redis client error', { error: err.message });
});

client.on('end', () => {
  isConnected = false;
  logger.warn('Redis connection closed');
});

client.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

/**
 * Connect to Redis
 * 
 * @returns {Promise<boolean>} True if connection successful
 */
const connect = async () => {
  if (isConnected) {
    return true;
  }
  
  try {
    await client.connect();
    return true;
  } catch (error) {
    logger.error('Redis connection failed', { error: error.message });
    return false;
  }
};

/**
 * Disconnect from Redis
 * Used for graceful shutdown
 */
const disconnect = async () => {
  if (!isConnected) {
    return;
  }
  
  try {
    await client.quit();
    isConnected = false;
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error('Error disconnecting from Redis', { error: error.message });
  }
};

/**
 * Get a value from Redis
 * 
 * @param {string} key - Redis key
 * @returns {Promise<string|null>} Value or null if not found
 */
const get = async (key) => {
  try {
    return await client.get(key);
  } catch (error) {
    logger.error('Redis GET error', { key, error: error.message });
    return null;
  }
};

/**
 * Set a value in Redis
 * 
 * @param {string} key - Redis key
 * @param {string} value - Value to store
 * @param {number} [ttl] - Time to live in seconds (optional)
 * @returns {Promise<boolean>} True if successful
 */
const set = async (key, value, ttl = null) => {
  try {
    if (ttl) {
      await client.setEx(key, ttl, value);
    } else {
      await client.set(key, value);
    }
    return true;
  } catch (error) {
    logger.error('Redis SET error', { key, error: error.message });
    return false;
  }
};

/**
 * Delete a key from Redis
 * 
 * @param {string} key - Redis key
 * @returns {Promise<boolean>} True if key was deleted
 */
const del = async (key) => {
  try {
    const result = await client.del(key);
    return result > 0;
  } catch (error) {
    logger.error('Redis DEL error', { key, error: error.message });
    return false;
  }
};

/**
 * Set a hash field
 * 
 * @param {string} key - Hash key
 * @param {string} field - Field name
 * @param {string} value - Field value
 * @returns {Promise<boolean>} True if successful
 */
const hset = async (key, field, value) => {
  try {
    await client.hSet(key, field, value);
    return true;
  } catch (error) {
    logger.error('Redis HSET error', { key, field, error: error.message });
    return false;
  }
};

/**
 * Get a hash field
 * 
 * @param {string} key - Hash key
 * @param {string} field - Field name
 * @returns {Promise<string|null>} Field value or null
 */
const hget = async (key, field) => {
  try {
    return await client.hGet(key, field);
  } catch (error) {
    logger.error('Redis HGET error', { key, field, error: error.message });
    return null;
  }
};

/**
 * Get all hash fields
 * 
 * @param {string} key - Hash key
 * @returns {Promise<Object>} All fields and values
 */
const hgetall = async (key) => {
  try {
    return await client.hGetAll(key);
  } catch (error) {
    logger.error('Redis HGETALL error', { key, error: error.message });
    return {};
  }
};

/**
 * Delete a hash field
 * 
 * @param {string} key - Hash key
 * @param {string} field - Field name
 * @returns {Promise<boolean>} True if field was deleted
 */
const hdel = async (key, field) => {
  try {
    const result = await client.hDel(key, field);
    return result > 0;
  } catch (error) {
    logger.error('Redis HDEL error', { key, field, error: error.message });
    return false;
  }
};

/**
 * Add a member to a set
 * 
 * @param {string} key - Set key
 * @param {string} member - Member to add
 * @returns {Promise<boolean>} True if member was added
 */
const sadd = async (key, member) => {
  try {
    await client.sAdd(key, member);
    return true;
  } catch (error) {
    logger.error('Redis SADD error', { key, error: error.message });
    return false;
  }
};

/**
 * Remove a member from a set
 * 
 * @param {string} key - Set key
 * @param {string} member - Member to remove
 * @returns {Promise<boolean>} True if member was removed
 */
const srem = async (key, member) => {
  try {
    const result = await client.sRem(key, member);
    return result > 0;
  } catch (error) {
    logger.error('Redis SREM error', { key, error: error.message });
    return false;
  }
};

/**
 * Get all members of a set
 * 
 * @param {string} key - Set key
 * @returns {Promise<Array>} Set members
 */
const smembers = async (key) => {
  try {
    return await client.sMembers(key);
  } catch (error) {
    logger.error('Redis SMEMBERS error', { key, error: error.message });
    return [];
  }
};

/**
 * Check if member exists in set
 * 
 * @param {string} key - Set key
 * @param {string} member - Member to check
 * @returns {Promise<boolean>} True if member exists
 */
const sismember = async (key, member) => {
  try {
    return await client.sIsMember(key, member);
  } catch (error) {
    logger.error('Redis SISMEMBER error', { key, error: error.message });
    return false;
  }
};

/**
 * Set key expiration
 * 
 * @param {string} key - Redis key
 * @param {number} seconds - TTL in seconds
 * @returns {Promise<boolean>} True if successful
 */
const expire = async (key, seconds) => {
  try {
    return await client.expire(key, seconds);
  } catch (error) {
    logger.error('Redis EXPIRE error', { key, error: error.message });
    return false;
  }
};

/**
 * Publish message to a channel
 * 
 * @param {string} channel - Channel name
 * @param {string} message - Message to publish
 * @returns {Promise<number>} Number of subscribers that received the message
 */
const publish = async (channel, message) => {
  try {
    return await client.publish(channel, message);
  } catch (error) {
    logger.error('Redis PUBLISH error', { channel, error: error.message });
    return 0;
  }
};

/**
 * Get connection status
 * 
 * @returns {boolean} Connection status
 */
const getConnectionStatus = () => isConnected;

/**
 * Get Redis client instance
 * 
 * @returns {Object} Redis client
 */
const getClient = () => client;

module.exports = {
  connect,
  disconnect,
  get,
  set,
  del,
  hset,
  hget,
  hgetall,
  hdel,
  sadd,
  srem,
  smembers,
  sismember,
  expire,
  publish,
  getConnectionStatus,
  getClient
};
