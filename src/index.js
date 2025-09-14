const express = require('express');
const corsMiddleware = require('./middleware/cors');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const addonRoutes = require('./routes/addonRoutes');
const configureRoutes = require('./routes/configureRoutes'); // Assuming you have this or similar

async function startServer() {
  const app = express();

  // Apply middleware
  app.use(corsMiddleware);

  // Mount routes
  // The addon routes are now handled by the addon SDK itself via getRouter
  // We need to initialize our addon handler first
  console.log('Initializing addon...');
  // Note: The AddonHandler will be initialized within the routes
  // to handle different configurations per request.

  app.use('/', addonRoutes);
  // app.use('/configure', configureRoutes); // Example for a config page

  // Error handling
  app.use(errorHandler);
  app.use(notFoundHandler);

  // Start server
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';

  app.listen(port, host, () => {
    console.log(`✅ Addon server running on: http://${host}:${port}`);
    console.log(`📋 Manifest URL: http://${host}:${port}/manifest.json`);
  });
}

startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});