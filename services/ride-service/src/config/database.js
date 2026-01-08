/**
 * PostgreSQL Database Configuration
 * 
 * This module provides connection pooling and query execution
 * for the PostgreSQL database used by the Ride Service.
 * 
 * @module config/database
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

// Database configuration from environment variables
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  database: process.env.POSTGRES_DB || 'wasil_rides',
  user: process.env.POSTGRES_USER || 'wasil',
  password: process.env.POSTGRES_PASSWORD || '',
  
  // Connection pool settings
  max: 20,                          // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,         // How long a client can be idle before being removed
  connectionTimeoutMillis: 2000,     // How long to wait for a connection
};

// Create the connection pool
const pool = new Pool(dbConfig);

// Log pool events
pool.on('connect', () => {
  logger.debug('New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', { error: err.message });
});

pool.on('remove', () => {
  logger.debug('Client removed from PostgreSQL pool');
});

/**
 * Execute a SQL query with parameters
 * 
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 * 
 * @example
 * const result = await query('SELECT * FROM rides WHERE id = $1', [1]);
 */
const query = async (text, params) => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Executed query', {
      query: text.substring(0, 100),
      duration: `${duration}ms`,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    logger.error('Database query error', {
      query: text.substring(0, 100),
      error: error.message
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transaction operations
 * 
 * @returns {Promise<Object>} Database client
 * 
 * @example
 * const client = await getClient();
 * try {
 *   await client.query('BEGIN');
 *   // ... your queries
 *   await client.query('COMMIT');
 * } catch (e) {
 *   await client.query('ROLLBACK');
 * } finally {
 *   client.release();
 * }
 */
const getClient = async () => {
  const client = await pool.connect();
  
  // Monkey patch the query method to add logging
  const originalQuery = client.query.bind(client);
  client.query = async (text, params) => {
    const start = Date.now();
    const result = await originalQuery(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Transaction query', {
      query: text.substring(0, 100),
      duration: `${duration}ms`
    });
    
    return result;
  };
  
  return client;
};

/**
 * Execute multiple queries in a transaction
 * 
 * @param {Function} callback - Async function that receives the client
 * @returns {Promise<any>} Result of the callback function
 * 
 * @example
 * const result = await transaction(async (client) => {
 *   await client.query('INSERT INTO rides ...');
 *   await client.query('UPDATE driver_locations ...');
 *   return { success: true };
 * });
 */
const transaction = async (callback) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Test database connection
 * 
 * @returns {Promise<boolean>} True if connection successful
 */
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time');
    logger.info('PostgreSQL connection successful', {
      time: result.rows[0].current_time
    });
    return true;
  } catch (error) {
    logger.error('PostgreSQL connection failed', { error: error.message });
    return false;
  }
};

/**
 * Close all pool connections
 * Used for graceful shutdown
 */
const closePool = async () => {
  logger.info('Closing PostgreSQL connection pool');
  await pool.end();
};

/**
 * Get pool statistics
 * 
 * @returns {Object} Pool statistics
 */
const getPoolStats = () => ({
  totalCount: pool.totalCount,
  idleCount: pool.idleCount,
  waitingCount: pool.waitingCount
});

module.exports = {
  query,
  getClient,
  transaction,
  testConnection,
  closePool,
  getPoolStats,
  pool
};
