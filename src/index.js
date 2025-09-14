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
    const manifest = getManifest();
    const landingPage = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${manifest.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #1a1a1a; color: #f0f0f0; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          .container { text-align: center; background-color: #2c2c2c; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-width: 500px; margin: 20px; }
          h1 { font-size: 2.5em; color: #fff; margin-bottom: 10px; }
          p { font-size: 1.1em; color: #a0a0a0; margin-bottom: 30px; }
          .button-container { display: flex; flex-direction: column; gap: 15px; }
          a.button { display: block; text-decoration: none; color: #fff; background-color: #8e44ad; padding: 15px 25px; border-radius: 8px; font-size: 1.2em; font-weight: bold; transition: background-color 0.3s, transform 0.2s; }
          a.button:hover { background-color: #9b59b6; transform: translateY(-2px); }
          a.button.secondary { background-color: #34495e; }
          a.button.secondary:hover { background-color: #4a627a; }
          .version { margin-top: 30px; font-size: 0.9em; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${manifest.name}</h1>
          <p>${manifest.description}</p>
          <div class="button-container">
            <a href="stremio://stremio.moindigital.in/manifest.json" class="button">Install Addon</a>
            <a href="/configure" class="button secondary">Configure</a>
          </div>
          <div class="version">Version ${manifest.version}</div>
        </div>
      </body>
      </html>
    `;
    res.type('text/html').send(landingPage);
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