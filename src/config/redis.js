import { createClient } from 'redis';
import logger from '../utils/logger.js';

let client;

export const connectRedis = async () => {
  try {
    client = createClient({
      username: process.env.REDIS_USERNAME || 'default',
      password: process.env.REDIS_PASSWORD || 'password',
      socket: {
        host: process.env.REDIS_HOST || 'host',
        port: process.env.REDIS_PORT || 6379
      }
    });

    client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    await client.connect();

    return client

  } catch (error) {
    logger.error('Redis connection error:', error);
    process.exit(1);
  }
};

export const getRedisClient = () => {
  if (!client) {
    throw new Error('Redis client not initialized. Call connectRedis first.');
  }
  return client;
};


// Health check function
export const checkRedisHealth = async () => {
  try {
    if (!client || !client.isReady) {
      return { status: 'down', message: 'Redis client not ready' };
    }
    
    await client.ping();
    const info = await client.info('server');
    
    return {
      status: 'up',
      message: 'Redis is healthy',
      info: {
        version: info.match(/redis_version:(.*)/)?.[1]?.trim(),
        uptime: info.match(/uptime_in_seconds:(.*)/)?.[1]?.trim(),
      }
    };
  } catch (error) {
    return { status: 'down', message: error.message };
  }
};
