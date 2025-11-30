import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { RequestHelper } from '../../../shared/helpers/RequestHelper';

const config = JSON.parse(open('../config/default.json'));
const request = new RequestHelper(config.baseUrl);

// Custom metrics
const rateLimitHits = new Counter('rate_limit_hits');
const successfulRequests = new Counter('successful_requests');

export const options = {
  scenarios: {
    // Scenario 1: Gradual ramp-up to test rate limit
    ramp_up: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 10,
      maxVUs: 50,
      stages: [
        { duration: '30s', target: 10 },  // Ramp to 10 req/s
        { duration: '30s', target: 50 },  // Ramp to 50 req/s
        { duration: '30s', target: 100 }, // Ramp to 100 req/s (likely to hit rate limit)
      ]
    }
  },
  thresholds: {
    'rate_limit_hits': ['count>0'], // Expect to hit rate limit
    'http_req_duration': ['p(95)<500']
  }
};

export default function () {
  // Make request to rate-limited endpoint
  // Using httpbin.org which has rate limiting
  const res = request.get('https://httpbin.org/get');

  // Check for rate limiting
  const isRateLimited = res.status === 429;
  
  if (isRateLimited) {
    rateLimitHits.add(1);
    
    // Log rate limit details
    console.log(`Rate limit hit at VU ${__VU}, iteration ${__ITER}`);
    
    // Check for Retry-After header
    const retryAfter = res.headers['Retry-After'] || res.headers['retry-after'];
    if (retryAfter) {
      console.log(`Retry-After: ${retryAfter} seconds`);
    }
    
    // Check for X-RateLimit headers
    const rateLimitRemaining = res.headers['X-RateLimit-Remaining'] || res.headers['x-ratelimit-remaining'];
    const rateLimitReset = res.headers['X-RateLimit-Reset'] || res.headers['x-ratelimit-reset'];
    
    if (rateLimitRemaining !== undefined) {
      console.log(`Rate Limit Remaining: ${rateLimitRemaining}`);
    }
    if (rateLimitReset !== undefined) {
      console.log(`Rate Limit Reset: ${rateLimitReset}`);
    }
  } else {
    successfulRequests.add(1);
  }

  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'response time acceptable': (r) => r.timings.duration < 1000
  });

  // Adaptive sleep based on rate limiting
  if (isRateLimited) {
    // Back off when rate limited
    sleep(5);
  } else {
    // Normal operation
    sleep(0.1);
  }
}

export function handleSummary(data) {
  const rateLimitCount = data.metrics.rate_limit_hits?.values?.count || 0;
  const successCount = data.metrics.successful_requests?.values?.count || 0;
  const totalRequests = rateLimitCount + successCount;
  
  console.log('\n=== Rate Limiting Summary ===');
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful: ${successCount} (${((successCount / totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Rate Limited: ${rateLimitCount} (${((rateLimitCount / totalRequests) * 100).toFixed(2)}%)`);
  
  return {
    'stdout': JSON.stringify(data, null, 2)
  };
}
