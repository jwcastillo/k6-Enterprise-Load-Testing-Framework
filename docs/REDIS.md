# Redis Data Support

## Overview

The framework includes complete Redis support, allowing you to share data between VUs (Virtual Users) and coordinate test execution.

## Use Cases

### 1. 🔄 Share Data Between VUs
- Authentication tokens
- Created resource IDs
- Shared counters

### 2. 📦 Cache Setup Data
- Pre-created test users
- Configuration data
- Product catalogs

### 3. 📊 Coordinate Execution
- Synchronization between VUs
- Distributed rate limiting
- Real-time statistics

## Installation

### Local
```bash
# Install Redis
brew install redis  # macOS
# or
apt-get install redis  # Ubuntu

# Start Redis
redis-server
```

### Docker
Redis is already included in `docker-compose.yml`:
```bash
docker-compose up redis
```

## RedisHelper API

### Connection
```typescript
import { RedisHelper } from '../../../shared/redis-helper.js';

const redis = new RedisHelper(); // Uses REDIS_URL from env
// or
const redis = new RedisHelper('redis://localhost:6379');
```

### Basic Operations

#### Set/Get
```typescript
// Set with optional TTL (in seconds)
await redis.set('key', 'value', 60);

// Get
const value = await redis.get('key');
```

#### Delete/Exists
```typescript
await redis.del('key');
const exists = await redis.exists('key');
```

### Multiple Operations

#### MSet/MGet
```typescript
// Multiple set
await redis.mset({
  'user:1:name': 'John',
  'user:1:email': 'john@test.com'
});

// Multiple get
const values = await redis.mget(['user:1:name', 'user:1:email']);
```

### Counters

```typescript
// Increment
const count = await redis.incr('login_count');
```

### Lists

```typescript
// Add to list
await redis.lpush('errors', 'Error message');

// Get size
const length = await redis.llen('errors');

// Get all items
const errors = await redis.lrange('errors', 0, -1);
```

### Hashes

```typescript
// Set hash field
await redis.hset('user:1', 'name', 'John');
await redis.hset('user:1', 'email', 'john@test.com');

// Get field
const name = await redis.hget('user:1', 'name');

// Get all fields
const user = await redis.hgetall('user:1');
// { name: 'John', email: 'john@test.com' }
```

## Complete Example

See `clients/client-a/scenarios/redis-test.ts`:

```typescript
import { RedisHelper } from '../../../shared/redis-helper.js';

const redis = new RedisHelper();

export async function setupData() {
  // Create users and save in Redis
  for (let i = 0; i < 10; i++) {
    const user = createUser();
    await redis.hset(`user:${i}`, 'username', user.username);
    await redis.hset(`user:${i}`, 'password', user.password);
  }
  await redis.set('user:count', '10', 300);
}

export async function loadTest() {
  // Use users from Redis
  const userIndex = Math.floor(Math.random() * 10);
  const userData = await redis.hgetall(`user:${userIndex}`);
  
  // Login with Redis user
  const loginRes = authService.login(
    userData.username, 
    userData.password
  );
  
  // Increment counter
  await redis.incr('stats:successful_logins');
}

export async function teardown() {
  // Clean up data
  for (let i = 0; i < 10; i++) {
    await redis.del(`user:${i}`);
  }
  await redis.disconnect();
}
```

## Load Data from CSV and JSON

### Example Files

**users.csv:**
```csv
username,email,password,role
john_doe,john@example.com,Pass123!,user
jane_smith,jane@example.com,Pass456!,admin
```

**products.json:**
```json
{
  "products": [
    {
      "id": "prod_001",
      "name": "Laptop Pro",
      "price": 1299.99,
      "category": "electronics",
      "stock": 50
    }
  ],
  "config": {
    "tax_rate": 0.08,
    "shipping_cost": 9.99
  }
}
```

### Load into Redis with SharedArray

```typescript
import { SharedArray } from 'k6/data';
import { RedisHelper } from '../../../shared/redis-helper.js';

const redis = new RedisHelper();

// Load CSV (manual parsing)
const csvData = new SharedArray('users', function () {
  const csvContent = open('../data/users.csv');
  const lines = csvContent.split('\n');
  
  const users = [];
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

// Load JSON
const jsonData = new SharedArray('products', function () {
  const jsonFile = open('../data/products.json');
  const data = JSON.parse(jsonFile);
  return [data]; // Wrap in array for SharedArray
});

export async function setupData() {
  // Load users from CSV to Redis
  for (let i = 0; i < csvData.length; i++) {
    const user = csvData[i];
    await redis.hset(`user:${i}`, 'username', user.username);
    await redis.hset(`user:${i}`, 'email', user.email);
    await redis.hset(`user:${i}`, 'password', user.password);
    await redis.hset(`user:${i}`, 'role', user.role);
  }
  await redis.set('user:count', csvData.length.toString(), 600);

  // Load products from JSON to Redis
  const data = jsonData[0];
  const products = data.products;
  
  for (const product of products) {
    await redis.hset(`product:${product.id}`, 'name', product.name);
    await redis.hset(`product:${product.id}`, 'price', product.price.toString());
    await redis.lpush('product:ids', product.id);
  }

  // Load configuration
  await redis.hset('config:store', 'tax_rate', data.config.tax_rate.toString());
  await redis.hset('config:store', 'shipping_cost', data.config.shipping_cost.toString());
}
```

### Complete Example

See `clients/client-a/scenarios/redis-data-loader.ts` for a complete example that includes:
- ✅ Loading users from CSV
- ✅ Loading products from JSON
- ✅ Storage in Redis with hashes and lists
- ✅ Using data in load test
- ✅ Statistics by category
- ✅ Cleanup in teardown

**Execute:**
```bash
node dist/core/cli.js --client=client-a --test=redis-data-loader.ts
```

## Utility Scripts (Standalone)

The framework includes standalone Node.js scripts to manage Redis data without running k6.

### Load Data (`scripts/load-redis-data.js`)
Load bulk data from CSV/JSON files to Redis.

```bash
# Basic usage (uses REDIS_URL from .env)
node scripts/load-redis-data.js

# Custom options
node scripts/load-redis-data.js --users=./data/users.csv --products=./data/products.json --clear
```

**Options:**
- `--users`: Path to users CSV file
- `--products`: Path to products JSON file
- `--clear`: Clear existing data before loading
- `--redis`: Redis connection URL (optional)

### Clean Data (`scripts/clean-redis-data.js`)
Delete all keys created by the framework (prefixes `user:`, `product:`, `config:`, `stats:`).

```bash
# Clean all
node scripts/clean-redis-data.js

# Clean specific pattern
node scripts/clean-redis-data.js --pattern="user:*"
```

**Recommended Workflow:**
1. Generate data: `node bin/generate-data.js`
2. Load to Redis: `node scripts/load-redis-data.js`
3. Run k6 Test: `node dist/core/cli.js ...`
4. Clean (optional): `node scripts/clean-redis-data.js`

## Run Tests with Redis

### Local
```bash
# Ensure Redis is running
redis-cli ping  # Should return "PONG"

# Run test
node dist/core/cli.js --client=client-a --test=redis-test.ts
```

### Docker
```bash
# Start Redis and run test
docker-compose up

# Or specifically
CLIENT=client-a TEST=redis-test.ts docker-compose up
```

## Common Patterns

### 1. Setup/Load/Teardown
```typescript
export async function setupData() {
  // Create test data in Redis
}

export default async function() {
  // Use data from Redis
}

export async function teardown() {
  // Clean Redis
}
```

### 2. User Pool
```typescript
// Setup: Create pool
for (let i = 0; i < 100; i++) {
  await redis.hset(`user:${i}`, 'token', generateToken());
}

// Test: Use from pool
const userId = __VU % 100;
const token = await redis.hget(`user:${userId}`, 'token');
```

### 3. Distributed Rate Limiting
```typescript
const key = `rate:${endpoint}:${minute}`;
const count = await redis.incr(key);
await redis.expire(key, 60);

if (count > MAX_REQUESTS_PER_MINUTE) {
  console.log('Rate limit exceeded, skipping request');
  return;
}
```

### 4. Real-Time Statistics
```typescript
// Increment counters
await redis.incr('stats:requests');
await redis.incr('stats:errors');

// Read in teardown
const requests = await redis.get('stats:requests');
const errors = await redis.get('stats:errors');
console.log(`Error rate: ${(errors/requests)*100}%`);
```

## Best Practices

### ✅ Use TTL
Always set TTL to avoid orphaned data:
```typescript
await redis.set('temp:data', value, 300); // 5 minutes
```

### ✅ Namespacing
Use prefixes to organize keys:
```typescript
await redis.set('user:123:token', token);
await redis.set('session:abc:data', data);
```

### ✅ Cleanup in Teardown
Always clean data in teardown:
```typescript
export async function teardown() {
  await redis.del('user:count');
  await redis.disconnect();
}
```

### ✅ Error Handling
```typescript
try {
  await redis.set('key', 'value');
} catch (error) {
  console.error('Redis error:', error);
}
```

### ❌ Avoid
- Don't use Redis for large data (>1MB)
- Don't make synchronous operations in the default function
- Don't forget disconnect() in teardown

## Troubleshooting

### Redis not connecting
```bash
# Verify Redis is running
redis-cli ping

# Check port
netstat -an | grep 6379

# Check URL
echo $REDIS_URL
```

### Data not persisting
- Check TTL
- Verify you're not calling `del()` prematurely

### Performance
- Use `mget`/`mset` for multiple operations
- Consider using pipelines for batch operations
- Monitor latency with `redis.info()`

## Environment Variables

```bash
# .env
REDIS_URL=redis://localhost:6379

# Docker
REDIS_URL=redis://redis:6379

# Redis with auth
REDIS_URL=redis://:password@localhost:6379
```
