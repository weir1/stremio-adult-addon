const express = require('express');
const corsMiddleware = require('./middleware/cors');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const addonRoutes = require('./routes/addonRoutes');
const ConfigService = require('./services/configService');
const { getManifest } = require('./config/manifest');

async function startServer() {
  const app = express();

  // Apply middleware
  app.use(corsMiddleware);

  // Health check and root endpoint
  app.get('/', (req, res) => {
    const manifest = getManifest(); // Get a base manifest for info
    res.json({
      ok: true,
      msg: 'Adult Content Addon is running.',
      version: manifest.version,
      configure: '/configure',
      manifest: '/manifest.json'
    });
  });

  // Configuration page
  app.get('/configure', (req, res) => {
    const configHtml = ConfigService.generateConfigPage();
    res.type('text/html').send(configHtml);
  });

  // Stremio addon routes
  app.use('/', addonRoutes);

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