import { check, sleep } from 'k6';
import { RedisHelper } from '../../../../shared/redis-helper.js';

const redis = new RedisHelper();

export const options = {
  vus: 2,
  duration: '5s',
  thresholds: {
    'checks': ['rate>0.9']
  }
};

export async function setup() {
  console.log('🔧 SETUP CALLED - Writing hardcoded data...');
  
  await redis.hset('simple:user:0', 'username', 'alice');
  await redis.hset('simple:user:1', 'username', 'bob');
  await redis.set('simple:user:count', '2', 600);
  
  console.log('✅ Setup complete - 2 users loaded');
}

export default async function () {
  const userCountStr = await redis.get('simple:user:count');
  const userCount = userCountStr ? parseInt(userCountStr) : 0;
  
  if (userCount === 0) {
    console.error('❌ No users in Redis');
    return;
  }

  const userIndex = Math.floor(Math.random() * userCount);
  const user = await redis.hgetall(`simple:user:${userIndex}`);

  check(null, {
    'user loaded': () => user.username !== undefined,
  });

  console.log(`User: ${user.username}`);
  sleep(1);
}

export async function teardown() {
  console.log('🧹 Teardown - cleaning up...');
  await redis.del('simple:user:0');
  await redis.del('simple:user:1');
  await redis.del('simple:user:count');
  console.log('✅ Cleanup complete');
}
