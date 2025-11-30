#!/usr/bin/env node

/**
 * Redis Data Cleanup Script
 * 
 * This script removes all test data from Redis that was loaded
 * by the load-redis-data.js script.
 * 
 * Usage:
 *   node scripts/clean-redis-data.js
 */

import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function main() {
  console.log('🧹 Redis Data Cleanup');
  console.log(`Redis URL: ${REDIS_URL}\n`);

  const redis = createClient({ url: REDIS_URL });
  
  redis.on('error', (err) => {
    console.error('❌ Redis Client Error:', err);
    process.exit(1);
  });

  await redis.connect();
  console.log('✅ Connected to Redis\n');

  try {
    // Get user count
    const userCountStr = await redis.get('user:count');
    const userCount = userCountStr ? parseInt(userCountStr) : 0;
    
    // Delete users
    console.log(`Deleting ${userCount} users...`);
    for (let i = 0; i < userCount; i++) {
      await redis.del(`user:${i}`);
    }
    await redis.del('user:count');
    console.log(`✅ Deleted ${userCount} users`);

    // Get product IDs
    const productIds = await redis.lRange('product:ids', 0, -1);
    
    // Delete products
    console.log(`Deleting ${productIds.length} products...`);
    for (const productId of productIds) {
      await redis.del(`product:${productId}`);
    }
    await redis.del('product:ids');
    console.log(`✅ Deleted ${productIds.length} products`);

    // Delete config
    await redis.del('config:store');
    console.log('✅ Deleted store configuration');

    // Delete stats (if any)
    await redis.del('stats:page_views');
    const categories = ['electronics', 'accessories'];
    for (const category of categories) {
      await redis.del(`stats:category:${category}`);
    }
    console.log('✅ Deleted statistics');

    console.log('\n✅ All test data cleaned up successfully!');

  } catch (error) {
    console.error('\n❌ Error cleaning data:', error);
    process.exit(1);
  } finally {
    await redis.disconnect();
    console.log('\n👋 Disconnected from Redis');
  }
}

main().catch(console.error);
