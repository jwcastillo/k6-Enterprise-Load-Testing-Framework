#!/usr/bin/env node

/**
 * Lightweight Mock Server for k6 Framework
 * 
 * Usage: node bin/mock-server.js --client=local --port=3000
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse arguments
const args = minimist(process.argv.slice(2));
const CLIENT = args.client || 'local';
const PORT = args.port || 3000;
const DELAY = args.delay || 0; // Global latency in ms

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  // Simulate latency
  if (DELAY > 0) {
    setTimeout(next, DELAY);
  } else {
    next();
  }
});

// Load mocks
const MOCKS_DIR = path.resolve(__dirname, `../../clients/${CLIENT}/mocks`);
const ROUTES_FILE = path.join(MOCKS_DIR, 'routes.json');

console.log(`🚀 Starting Mock Server for client: ${CLIENT}`);
console.log(`📂 Mocks directory: ${MOCKS_DIR}`);

// Ensure mocks directory exists
if (!fs.existsSync(MOCKS_DIR)) {
  console.warn(`⚠️  Warning: Mocks directory not found at ${MOCKS_DIR}`);
  console.log(`Creating directory structure...`);
  fs.mkdirSync(MOCKS_DIR, { recursive: true });
  
  // Create example routes file
  const exampleRoutes = {
    "routes": [
      {
        "method": "GET",
        "path": "/api/health",
        "response": {
          "status": 200,
          "body": { "status": "ok", "version": "1.0.0" }
        }
      },
      {
        "method": "POST",
        "path": "/api/users",
        "response": {
          "status": 201,
          "body": { "id": "user_123", "created": true }
        }
      }
    ]
  };
  fs.writeFileSync(ROUTES_FILE, JSON.stringify(exampleRoutes, null, 2));
  console.log(`✅ Created example routes.json`);
}

// Load dynamic JS mocks (middleware style)
const jsMocks = globSync(`${MOCKS_DIR}/**/*.js`);
for (const file of jsMocks) {
  try {
    const mockModule = await import(file);
    const mockFn = mockModule.default || mockModule;
    
    if (typeof mockFn === 'function') {
      console.log(`🔌 Loading dynamic mock: ${path.basename(file)}`);
      mockFn(app);
    }
  } catch (err) {
    console.error(`❌ Error loading mock ${file}:`, err.message);
  }
}

// Load static JSON routes
if (fs.existsSync(ROUTES_FILE)) {
  try {
    const routesConfig = JSON.parse(fs.readFileSync(ROUTES_FILE, 'utf8'));
    
    if (routesConfig.routes && Array.isArray(routesConfig.routes)) {
      routesConfig.routes.forEach(route => {
        const method = (route.method || 'GET').toLowerCase();
        const routePath = route.path;
        const response = route.response || {};
        const status = response.status || 200;
        const body = response.body || {};
        const headers = response.headers || {};
        const delay = route.delay || 0;

        console.log(`📍 Registering route: ${method.toUpperCase()} ${routePath}`);

        app[method](routePath, (req, res) => {
          // Set custom headers
          Object.keys(headers).forEach(key => {
            res.set(key, headers[key]);
          });

          // Route-specific delay
          const responseFn = () => {
            res.status(status).json(body);
          };

          if (delay > 0) {
            setTimeout(responseFn, delay);
          } else {
            responseFn();
          }
        });
      });
    }
  } catch (err) {
    console.error(`❌ Error loading routes.json:`, err.message);
  }
}

// Default 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.url} not defined in mock server`,
    hint: `Add this route to clients/${CLIENT}/mocks/routes.json`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✨ Mock Server running at http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to stop\n`);
});
