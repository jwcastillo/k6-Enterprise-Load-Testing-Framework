import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { RedisHelper } from '../../../../shared/redis-helper.js';
import { DataHelper } from '../../../../shared/helpers/DataHelper.js';

const redis = new RedisHelper();

const csvData = new SharedArray('users', function () {
  return [{ username: 'testuser', email: 'test@example.com' }];
});

export const options = {
  vus: 1,
  duration: '5s',
  thresholds: {
    'checks': ['rate>0.9']
  }
};

export async function setup() {
  console.log('🔧 Setup: Writing test data to Redis...');
  console.log(`DEBUG: csvData length: ${csvData.length}`);
  
  const user = csvData[0];
  await redis.hset('debug:user', 'username', user.username);
  await redis.set('debug:counter', '0', 60);
  
  console.log('✅ Setup complete');
}

export default async function () {
  const value = await redis.hget('debug:user', 'username');
  const counter = await redis.incr('debug:counter');
  
  check(null, {
    'value exists': () => value === 'testuser',
    'counter incremented': () => counter > 0,
  });
  
  console.log(`Value: ${value}, Counter: ${counter}`);
  sleep(1);
}

export async function teardown() {
  console.log('🧹 Teardown: Cleaning up...');
  await redis.del('debug:user');
  await redis.del('debug:counter');
  console.log('✅ Cleanup complete');
}
