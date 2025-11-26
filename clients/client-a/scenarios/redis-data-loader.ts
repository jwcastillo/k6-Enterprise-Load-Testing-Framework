import { SharedArray } from 'k6/data';
import { check, sleep } from 'k6';
import { ConfigLoader } from '../../../core/config.js';
import { RedisHelper } from '../../../shared/redis-helper.js';

const config = new ConfigLoader().load();
const redis = new RedisHelper();

// Type definitions
interface UserData {
  username: string;
  email: string;
  password: string;
  role: string;
}

interface ProductData {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
}

interface StoreConfig {
  tax_rate: number;
  shipping_cost: number;
  free_shipping_threshold: number;
}

interface JsonData {
  products: ProductData[];
  config: StoreConfig;
}

// Load CSV data using SharedArray (loaded once, shared across VUs)
// Note: In k6, CSV parsing is done manually or you can use a custom parser
const csvData = new SharedArray('users', function (): UserData[] {
  const csvContent = open('../data/users.csv');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  const users: UserData[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    const values = lines[i].split(',');
    users.push({
      username: values[0],
      email: values[1],
      password: values[2],
      role: values[3]
    });
  }
  return users;
});

// Load JSON data using SharedArray
// SharedArray requires returning an array, so we wrap the data
const jsonData = new SharedArray('products', function (): JsonData[] {
  const jsonFile = open('../data/products.json');
  const data = JSON.parse(jsonFile) as JsonData;
  return [data]; // Wrap in array for SharedArray
});

export const options = {
  scenarios: {
    setup_phase: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '30s',
      exec: 'setupData',
    },
    load_phase: {
      executor: 'constant-vus',
      vus: 3,
      duration: '30s',
      startTime: '35s',
      exec: 'loadTest',
    },
  },
  thresholds: {
    'checks': ['rate>0.9']
  }
};

/**
 * Setup phase: Load CSV and JSON data into Redis
 */
export async function setupData() {
  console.log('📦 Loading data from CSV and JSON into Redis...');

  // Load users from CSV
  console.log(`📄 Loading ${csvData.length} users from CSV...`);
  for (let i = 0; i < csvData.length; i++) {
    const user = csvData[i];
    
    // Store each user as a Redis hash
    await redis.hset(`user:${i}`, 'username', user.username);
    await redis.hset(`user:${i}`, 'email', user.email);
    await redis.hset(`user:${i}`, 'password', user.password);
    await redis.hset(`user:${i}`, 'role', user.role);
    
    console.log(`  ✅ Loaded user: ${user.username} (${user.role})`);
  }
  await redis.set('user:count', csvData.length.toString(), 600);

  // Load products from JSON
  const data = jsonData[0]; // SharedArray stores data at index 0
  const products = data.products;
  console.log(`📄 Loading ${products.length} products from JSON...`);
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    // Store each product as a Redis hash
    await redis.hset(`product:${product.id}`, 'name', product.name);
    await redis.hset(`product:${product.id}`, 'price', product.price.toString());
    await redis.hset(`product:${product.id}`, 'category', product.category);
    await redis.hset(`product:${product.id}`, 'stock', product.stock.toString());
    
    // Also store product ID in a list for easy random access
    await redis.lpush('product:ids', product.id);
    
    console.log(`  ✅ Loaded product: ${product.name} ($${product.price})`);
  }

  // Store config from JSON
  const configData = data.config;
  await redis.hset('config:store', 'tax_rate', configData.tax_rate.toString());
  await redis.hset('config:store', 'shipping_cost', configData.shipping_cost.toString());
  await redis.hset('config:store', 'free_shipping_threshold', configData.free_shipping_threshold.toString());
  
  console.log('✅ Setup complete!');
  console.log(`   - ${csvData.length} users loaded from CSV`);
  console.log(`   - ${products.length} products loaded from JSON`);
  console.log('   - Store config loaded from JSON');
}

/**
 * Load test phase: Use data from Redis
 */
export async function loadTest() {
  // Get a random user from Redis
  const userCountStr = await redis.get('user:count');
  const userCount = userCountStr ? parseInt(userCountStr) : 0;
  
  if (userCount === 0) {
    console.error('❌ No users in Redis');
    return;
  }

  const userIndex = Math.floor(Math.random() * userCount);
  const user = await redis.hgetall(`user:${userIndex}`);

  // Get a random product from Redis
  const productIds = await redis.lrange('product:ids', 0, -1);
  if (productIds.length === 0) {
    console.error('❌ No products in Redis');
    return;
  }

  const randomProductId = productIds[Math.floor(Math.random() * productIds.length)];
  const product = await redis.hgetall(`product:${randomProductId}`);

  // Get store config
  const storeConfig = await redis.hgetall('config:store');

  // Simulate a purchase scenario
  const checks = check(null, {
    'user loaded': () => user.username !== undefined,
    'product loaded': () => product.name !== undefined,
    'config loaded': () => storeConfig.tax_rate !== undefined,
  });

  if (checks) {
    console.log(`🛒 ${user.username} (${user.role}) viewing ${product.name} ($${product.price})`);
    
    // Calculate total with tax
    const price = parseFloat(product.price);
    const taxRate = parseFloat(storeConfig.tax_rate);
    const total = price * (1 + taxRate);
    
    console.log(`   Total with tax: $${total.toFixed(2)}`);
    
    // Track stats
    await redis.incr('stats:page_views');
    await redis.incr(`stats:category:${product.category}`);
  }

  sleep(1);
}

/**
 * Teardown: Display stats and clean up
 */
export async function teardown() {
  console.log('📊 Test Statistics:');
  
  const pageViews = await redis.get('stats:page_views');
  console.log(`   - Total page views: ${pageViews || 0}`);
  
  // Show category stats
  const categories = ['electronics', 'accessories'];
  for (const category of categories) {
    const views = await redis.get(`stats:category:${category}`);
    console.log(`   - ${category} views: ${views || 0}`);
  }

  console.log('\n🧹 Cleaning up Redis...');
  
  // Clean up users
  const userCountStr = await redis.get('user:count');
  const userCount = userCountStr ? parseInt(userCountStr) : 0;
  for (let i = 0; i < userCount; i++) {
    await redis.del(`user:${i}`);
  }
  await redis.del('user:count');

  // Clean up products
  const productIds = await redis.lrange('product:ids', 0, -1);
  for (const productId of productIds) {
    await redis.del(`product:${productId}`);
  }
  await redis.del('product:ids');

  // Clean up config and stats
  await redis.del('config:store');
  await redis.del('stats:page_views');
  for (const category of categories) {
    await redis.del(`stats:category:${category}`);
  }

  console.log('✅ Cleanup complete');
}

export default loadTest;
