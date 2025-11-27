#!/usr/bin/env node

/**
 * Redis Data Loader Script
 * 
 * This script loads test data from CSV and JSON files into Redis
 * before running k6 tests. This bypasses k6's async setup() limitations.
 * 
 * Usage:
 *   node scripts/load-redis-data.js --client=client-a
 */

import { createClient } from 'redis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import minimist from 'minimist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = minimist(process.argv.slice(2));
const client = args.client || 'client-a';

// Redis connection
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Parse CSV line with proper handling of quoted fields
 */
function parseCsvLine(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Load users from CSV file
 */
function loadUsersFromCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = parseCsvLine(lines[0]);
  
  const users = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    const values = parseCsvLine(lines[i]);
    users.push({
      username: values[0],
      email: values[1],
      password: values[2],
      role: values[3]
    });
  }
  return users;
}

/**
 * Load products and config from JSON file
 */
function loadDataFromJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Main function
 */
async function main() {
  console.log('📦 Redis Data Loader');
  console.log(`Client: ${client}`);
  console.log(`Redis URL: ${REDIS_URL}\n`);

  // Connect to Redis
  const redis = createClient({ url: REDIS_URL });
  
  redis.on('error', (err) => {
    console.error('❌ Redis Client Error:', err);
    process.exit(1);
  });

  await redis.connect();
  console.log('✅ Connected to Redis\n');

  try {
    // Load CSV data
    const csvPath = path.join(__dirname, '..', 'clients', client, 'data', 'users.csv');
    console.log(`📄 Loading users from: ${csvPath}`);
    const users = loadUsersFromCsv(csvPath);
    console.log(`   Found ${users.length} users`);

    // Store users in Redis
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      await redis.hSet(`user:${i}`, {
        username: user.username,
        email: user.email,
        password: user.password,
        role: user.role
      });
      console.log(`   ✅ Loaded user: ${user.username} (${user.role})`);
    }
    await redis.set('user:count', users.length.toString());
    await redis.expire('user:count', 600); // 10 minutes TTL

    console.log('');

    // Load JSON data
    const jsonPath = path.join(__dirname, '..', 'clients', client, 'data', 'products.json');
    console.log(`📄 Loading products from: ${jsonPath}`);
    const data = loadDataFromJson(jsonPath);
    const products = data.products;
    console.log(`   Found ${products.length} products`);

    // Store products in Redis
    for (const product of products) {
      await redis.hSet(`product:${product.id}`, {
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        stock: product.stock.toString()
      });
      await redis.lPush('product:ids', product.id);
      console.log(`   ✅ Loaded product: ${product.name} ($${product.price})`);
    }

    console.log('');

    // Store config
    console.log('📄 Loading store configuration');
    await redis.hSet('config:store', {
      tax_rate: data.config.tax_rate.toString(),
      shipping_cost: data.config.shipping_cost.toString(),
      free_shipping_threshold: data.config.free_shipping_threshold.toString()
    });
    console.log(`   ✅ Tax rate: ${data.config.tax_rate}`);
    console.log(`   ✅ Shipping cost: $${data.config.shipping_cost}`);
    console.log(`   ✅ Free shipping threshold: $${data.config.free_shipping_threshold}`);

    console.log('\n✅ All data loaded successfully!');
    console.log(`   - ${users.length} users`);
    console.log(`   - ${products.length} products`);
    console.log('   - Store configuration');

  } catch (error) {
    console.error('\n❌ Error loading data:', error);
    process.exit(1);
  } finally {
    await redis.disconnect();
    console.log('\n👋 Disconnected from Redis');
  }
}

main().catch(console.error);
