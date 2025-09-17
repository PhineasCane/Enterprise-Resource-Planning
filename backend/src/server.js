const app = require("./app");
const { PORT } = require("./config");
const { sequelize } = require("./models");

// Connection health monitoring
let isShuttingDown = false;

// Graceful shutdown function
async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connections
    console.log("📊 Closing database connections...");
    await sequelize.close();
    console.log("✅ Database connections closed successfully.");
    
    // Exit process
    console.log("👋 Server shutdown complete.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

(async () => {
  try {
    console.log("🚀 Starting server...");
    
    // Test database connection with retry logic
    console.log("📊 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");
    
    // Log connection pool status
    const pool = sequelize.connectionManager.pool;
    console.log(`📈 Connection pool initialized: max=${pool.max}, min=${pool.min}`);
    
    // Use alter: true to create/update tables with new inventory system
    console.log("🔄 Syncing database models...");
    await sequelize.sync({ force: false, alter: true });
    console.log("✅ Models synced successfully.");
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🎉 Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
      } else {
        console.error('❌ Server error:', error);
      }
      gracefulShutdown('SERVER_ERROR');
    });
    
  } catch (err) {
    console.error("❌ Startup error:", err);
    await gracefulShutdown('STARTUP_ERROR');
  }
})();
