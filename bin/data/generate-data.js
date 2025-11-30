#!/usr/bin/env node

/**
 * generate-data.js - Generate test data (CSV/JSON) from templates
 * Usage: node bin/generate-data.js --type=users --count=100 --output=clients/client-a/data/users.csv
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
  const [key, value] = arg.split('=');
  options[key.replace('--', '')] = value;
});

const { type, count = '10', output } = options;

if (!type || !output) {
  console.error('Usage: node bin/generate-data.js --type=<type> --count=<count> --output=<path>');
  console.error('');
  console.error('Types: users, products, orders');
  console.error('');
  console.error('Examples:');
  console.error('  node bin/generate-data.js --type=users --count=100 --output=clients/client-a/data/users.csv');
  console.error('  node bin/generate-data.js --type=products --count=50 --output=clients/client-a/data/products.json');
  process.exit(1);
}

const recordCount = parseInt(count);

// Data generators
const generators = {
  users: (count) => {
    const roles = ['user', 'admin', 'moderator'];
    const users = [];
    
    for (let i = 0; i < count; i++) {
      users.push({
        username: `user_${Date.now()}_${i}`,
        email: `user${i}@test.com`,
        password: `Pass${i}123!`,
        role: roles[Math.floor(Math.random() * roles.length)]
      });
    }
    
    return users;
  },
  
  products: (count) => {
    const categories = ['electronics', 'accessories', 'clothing', 'books'];
    const products = [];
    
    for (let i = 0; i < count; i++) {
      products.push({
        id: `prod_${String(i + 1).padStart(3, '0')}`,
        name: `Product ${i + 1}`,
        price: parseFloat((Math.random() * 1000 + 10).toFixed(2)),
        category: categories[Math.floor(Math.random() * categories.length)],
        stock: Math.floor(Math.random() * 500) + 1
      });
    }
    
    return products;
  },
  
  orders: (count) => {
    const statuses = ['pending', 'processing', 'shipped', 'delivered'];
    const orders = [];
    
    for (let i = 0; i < count; i++) {
      orders.push({
        id: `order_${String(i + 1).padStart(5, '0')}`,
        userId: `user_${Math.floor(Math.random() * 100)}`,
        total: parseFloat((Math.random() * 5000 + 50).toFixed(2)),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    return orders;
  }
};

// Generate data
if (!generators[type]) {
  console.error(`Unknown type: ${type}`);
  console.error(`Available types: ${Object.keys(generators).join(', ')}`);
  process.exit(1);
}

console.log(`Generating ${recordCount} ${type}...`);
const data = generators[type](recordCount);

// Determine output format
const ext = path.extname(output);
const outputPath = path.resolve(output);

// Ensure directory exists
fs.ensureDirSync(path.dirname(outputPath));

if (ext === '.csv') {
  // Generate CSV
  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(','),
    ...data.map(row => keys.map(key => row[key]).join(','))
  ].join('\n');
  
  fs.writeFileSync(outputPath, csv);
  console.log(`✅ Generated ${recordCount} records to ${outputPath}`);
} else if (ext === '.json') {
  // Generate JSON
  fs.writeJsonSync(outputPath, { [type]: data }, { spaces: 2 });
  console.log(`✅ Generated ${recordCount} records to ${outputPath}`);
} else {
  console.error(`Unsupported output format: ${ext}`);
  console.error('Supported formats: .csv, .json');
  process.exit(1);
}
