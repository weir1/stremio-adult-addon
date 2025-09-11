const express = require('express');
const corsMiddleware = require('./middleware/cors');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const { manifest } = require('./config/manifest');

const app = express();

// Apply middleware
app.use(corsMiddleware);

// Mount routes
app.use('/', routes);

// Error handling
app.use(errorHandler);
app.use(notFoundHandler);

// Start server
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`✅ Adult Content Addon server running on: http://${host}:${port}`);
  console.log(`📋 Manifest URL (Public): https://stremio.moindigital.in/manifest.json`);
  console.log(`⚙️ Configure URL: https://stremio.moindigital.in/configure`);
  console.log(`🎯 Version ${manifest.version} - Modular Architecture!`);
  console.log('');
  console.log('📁 Modular Structure:');
  console.log('  ├── handlers/ (catalog, meta, stream)');
  console.log('  ├── routes/ (addon routes, main routes)');
  console.log('  ├── middleware/ (cors, error handling)');
  console.log('  ├── services/ (torbox, config)');
  console.log('  ├── utils/ (cache, poster generation)');
  console.log('  └── config/ (manifest)');
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
