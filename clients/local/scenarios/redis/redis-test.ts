import { check, sleep } from 'k6';
import { ConfigLoader } from '../../../../core/config.js';
import { AuthService } from '../../lib/auth-service.js';
import { RedisHelper } from '../../../../shared/redis-helper.js';
import { DataHelper } from '../../../../shared/helpers/DataHelper.js';

const config = new ConfigLoader().load();
const authService = new AuthService(config.baseUrl);
const redis = new RedisHelper();

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
      vus: 5,
      duration: '30s',
      startTime: '35s',
      exec: 'loadTest',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<2000'],
    'checks': ['rate>0.9']
  }
};

/**
 * Setup phase: Create test users and store in Redis
 */
export async function setupData() {
  console.log('🔧 Setup Phase: Creating test users and storing in Redis...');

  const users = [];
  for (let i = 0; i < 10; i++) {
    const username = `test_user_${DataHelper.randomString(8)}`;
    const email = DataHelper.randomEmail();
    const password = DataHelper.randomPassword();

    // Create user via API
    const registerRes = authService.register(username, email, password);
    
    if (registerRes.status === 201) {
      // Store user credentials in Redis
      await redis.hset(`user:${i}`, 'username', username);
      await redis.hset(`user:${i}`, 'email', email);
      await redis.hset(`user:${i}`, 'password', password);
      
      users.push({ username, email, password });
      console.log(`✅ Created and stored user: ${username}`);
    }

    sleep(0.5);
  }

  // Store user count
  await redis.set('user:count', users.length.toString(), 300);
  
  console.log(`✅ Setup complete: ${users.length} users created and stored in Redis`);
}

/**
 * Load test phase: Use users from Redis
 */
export async function loadTest() {
  // Get total user count
  const userCountStr = await redis.get('user:count');
  const userCount = userCountStr ? parseInt(userCountStr) : 0;

  if (userCount === 0) {
    console.error('❌ No users found in Redis');
    return;
  }

  // Get a random user from Redis
  const userIndex = Math.floor(Math.random() * userCount);
  const userData = await redis.hgetall(`user:${userIndex}`);

  if (!userData.username || !userData.password) {
    console.error(`❌ Invalid user data for index ${userIndex}`);
    return;
  }

  // Login with user from Redis
  const loginRes = authService.login(userData.username, userData.password);
  
  const loginCheck = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'login returns token': (r) => {
      if (!r.body) return false;
      return JSON.parse(r.body as string).auth_token !== undefined;
    }
  });

  if (loginCheck && loginRes.body) {
    const token = JSON.parse(loginRes.body as string).auth_token;
    
    // Store successful login count in Redis
    await redis.incr('stats:successful_logins');
    
    console.log(`✅ User ${userData.username} logged in successfully`);
    
    // Logout
    authService.logout(token);
  } else {
    await redis.incr('stats:failed_logins');
    console.error(`❌ Login failed for user ${userData.username}`);
  }

  sleep(1);
}

/**
 * Teardown: Clean up Redis data
 */
export async function teardown() {
  console.log('🧹 Teardown: Cleaning up Redis data...');
  
  const userCountStr = await redis.get('user:count');
  const userCount = userCountStr ? parseInt(userCountStr) : 0;

  // Delete all user data
  for (let i = 0; i < userCount; i++) {
    await redis.del(`user:${i}`);
  }

  // Get and log stats
  const successfulLogins = await redis.get('stats:successful_logins');
  const failedLogins = await redis.get('stats:failed_logins');
  
  console.log(`📊 Stats:`);
  console.log(`  - Successful logins: ${successfulLogins || 0}`);
  console.log(`  - Failed logins: ${failedLogins || 0}`);

  // Clean up stats
  await redis.del('user:count');
  await redis.del('stats:successful_logins');
  await redis.del('stats:failed_logins');
  
  console.log('✅ Teardown complete');
}

export default loadTest;
