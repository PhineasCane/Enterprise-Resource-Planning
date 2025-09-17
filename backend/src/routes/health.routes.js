const router = require("express").Router();
const { sequelize } = require("../models");

router.get("/", async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    // Get connection pool status
    const pool = sequelize.connectionManager.pool;
    const poolStatus = {
      total: pool.size,
      used: pool.used,
      waiting: pool.pending,
      idle: pool.available,
      max: pool.max,
      min: pool.min
    };
    
    res.status(200).json({ 
      status: "ok",
      database: "connected",
      pool: poolStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({ 
      status: "error",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;


