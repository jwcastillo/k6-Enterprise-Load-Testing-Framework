import { SharedArray } from 'k6/data';
import { RedisHelper } from '../../../../shared/redis-helper.js';
import { DataHelper } from '../../../../shared/helpers/DataHelper.js';

const redis = new RedisHelper();

const csvData = new SharedArray('users', function () {
  const csvContent = open('../data/users.csv');
  const lines = csvContent.split('\n');
  const headers = DataHelper.parseCsvLine(lines[0]);
  
  const users: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    const values = DataHelper.parseCsvLine(lines[i]);
    users.push({
      username: values[0],
      email: values[1],
      password: values[2],
      role: values[3]
    });
  }
  return users;
});

export const options = {
  vus: 1,
  iterations: 1,
};

export default async function () {
  console.log('🔧 Manual setup test - loading data...');
  console.log(`CSV Data length: ${csvData.length}`);
  
  // Load just one user
  const user = csvData[0];
  console.log(`Loading user: ${user.username}`);
  
  await redis.hset('test:user:0', 'username', user.username);
  await redis.hset('test:user:0', 'email', user.email);
  await redis.set('test:user:count', '1', 600);
  
  console.log('✅ Data written to Redis');
  
  // Verify immediately
  const retrieved = await redis.hget('test:user:0', 'username');
  const count = await redis.get('test:user:count');
  
  console.log(`Retrieved username: ${retrieved}`);
  console.log(`Retrieved count: ${count}`);
  
  if (retrieved === user.username && count === '1') {
    console.log('✅ Data verified successfully!');
  } else {
    console.error('❌ Data verification failed!');
  }
}
