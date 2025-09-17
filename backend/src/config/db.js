const { Sequelize } = require("sequelize");
const { DATABASE_URL } = require("./index");

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  // Connection Pooling Configuration
  pool: {
    max: 20,           // Maximum number of connections in pool
    min: 5,            // Minimum number of connections in pool
    acquire: 30000,    // Maximum time (ms) that pool will try to get connection before throwing error
    idle: 10000,       // Maximum time (ms) that a connection can be idle before being released
    evict: 1000,       // Time interval (ms) to check for idle connections
    handleDisconnects: true, // Automatically handle disconnections
  },
  // Connection retry configuration
  retry: {
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /ESOCKETTIMEDOUT/,
      /EHOSTUNREACH/,
      /EPIPE/,
      /EAI_AGAIN/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ],
    max: 3,            // Maximum number of retries
    backoffBase: 1000, // Base delay between retries (ms)
    backoffExponent: 1.5, // Exponential backoff multiplier
  },
  // Keep-alive settings
  keepAlive: true,
  keepAliveInitialDelay: 0,
  // Query timeout
  queryTimeout: 30000, // 30 seconds
  // Transaction timeout
  transactionTimeout: 30000, // 30 seconds
  // Connection validation
  validate: true,
  // Benchmark mode for performance monitoring
  benchmark: false,
});

module.exports = sequelize;
