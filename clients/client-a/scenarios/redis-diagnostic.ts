import { RedisHelper } from '../../../shared/redis-helper.js';

const redis = new RedisHelper();

export const options = {
  vus: 1,
  iterations: 1,
};

export default async function () {
  console.log('🔍 Diagnostic Test - Checking Redis data');
  
  // Test 1: Get user count
  const userCount = await redis.get('user:count');
  console.log(`user:count = ${userCount}`);
  
  // Test 2: Get user:0 hash
  console.log('\nTesting hgetall on user:0:');
  const user0 = await redis.hgetall('user:0');
  console.log(`Result type: ${typeof user0}`);
  console.log(`Result: ${JSON.stringify(user0)}`);
  console.log(`username: ${user0.username}`);
  console.log(`email: ${user0.email}`);
  console.log(`role: ${user0.role}`);
  
  // Test 3: Get individual fields
  console.log('\nTesting hget on user:0:');
  const username = await redis.hget('user:0', 'username');
  const email = await redis.hget('user:0', 'email');
  console.log(`username (hget): ${username}`);
  console.log(`email (hget): ${email}`);
  
  // Test 4: Get product IDs
  console.log('\nTesting lrange on product:ids:');
  const productIds = await redis.lrange('product:ids', 0, -1);
  console.log(`Product IDs: ${JSON.stringify(productIds)}`);
  console.log(`Product IDs length: ${productIds.length}`);
  
  if (productIds.length > 0) {
    const firstProductId = productIds[0];
    console.log(`\nTesting hgetall on product:${firstProductId}:`);
    const product = await redis.hgetall(`product:${firstProductId}`);
    console.log(`Result: ${JSON.stringify(product)}`);
    console.log(`name: ${product.name}`);
  }
}
