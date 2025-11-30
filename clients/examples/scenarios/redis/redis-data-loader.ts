import { check, sleep } from 'k6';
import { RedisHelper } from '../../../../shared/redis-helper.js';

const redis = new RedisHelper();

export const options = {
  vus: 3,
  duration: '30s',
  thresholds: {
    'checks': ['rate>0.9']
  }
};

/**
 * NOTE: Data must be pre-loaded into Redis before running this test.
 * Run: npm run redis:load -- --client=client-a
 */

export default async function () {
  // Get a random user from Redis
  const userCountStr = await redis.get('user:count');
  const userCount = userCountStr ? parseInt(userCountStr) : 0;
  
  if (userCount === 0) {
    console.error('❌ No users in Redis - run "npm run redis:load" first');
    return;
  }

  const userIndex = Math.floor(Math.random() * userCount);
  const user = await redis.hgetall(`user:${userIndex}`);

  // Get a random product from Redis
  const productIds = await redis.lrange('product:ids', 0, -1);
  if (productIds.length === 0) {
    console.error('❌ No products in Redis - run "npm run redis:load" first');
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
  
  console.log('\n💡 To clean up Redis data, run: npm run redis:clean');
}
