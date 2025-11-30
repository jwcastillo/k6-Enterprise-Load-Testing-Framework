import { check, sleep } from 'k6';
import { RedisHelper } from '../../../../shared/redis-helper.js';

const redis = new RedisHelper();

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    'checks': ['rate>0.9']
  }
};

export async function setup() {
  console.log('🔧 Setup: Writing test data to Redis...');
  
  await redis.hset('test:hash', 'field1', 'value1');
  await redis.set('test:counter', '0', 60);
  
  console.log('✅ Setup complete');
}

export default async function () {
  const value = await redis.hget('test:hash', 'field1');
  const counter = await redis.incr('test:counter');
  
  check(null, {
    'value exists': () => value === 'value1',
    'counter incremented': () => counter > 0,
  });
  
  console.log(`Value: ${value}, Counter: ${counter}`);
  sleep(1);
}

export async function teardown() {
  console.log('🧹 Teardown: Cleaning up...');
  
  const finalCounter = await redis.get('test:counter');
  console.log(`Final counter value: ${finalCounter}`);
  
  await redis.del('test:key');
  await redis.del('test:counter');
  
  console.log('✅ Cleanup complete');
}
