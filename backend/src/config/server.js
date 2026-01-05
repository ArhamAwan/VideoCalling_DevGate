import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Serve static files from frontend directory (or dist if built)
  const frontendPath = path.join(__dirname, '../../../dist');
  const fallbackPath = path.join(__dirname, '../../../frontend');

  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
  } else {
    app.use(express.static(fallbackPath));
  }

  return app;
}

export function createServer(app) {
  return http.createServer(app);
}

