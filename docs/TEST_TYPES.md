# Test Types Quick Reference

## Overview

The framework supports 4 types of load tests:

## 1. 🎯 Unit Tests (API Endpoints)

**Purpose**: Test individual API endpoints in isolation.

**File**: `clients/client-a/scenarios/example.ts`

**Characteristics**:
- Single endpoint test
- Simple validations (status code, response time)
- Ideal for smoke tests and health checks

**Execution example**:
```bash
node dist/core/cli.js --client=client-a --env=default --test=example.ts
```

**Key metrics**:
- `http_req_duration`
- `http_req_failed`
- `checks`

---

## 2. 🔄 Flow Tests (Multi-Step Scenarios)

**Purpose**: Test complete user flows with multiple sequential steps.

**File**: `clients/client-a/scenarios/auth-flow.ts`

**Characteristics**:
- Multiple steps: Register → Login → Logout
- State management between steps
- Conditional execution based on previous results
- End-to-end flow validation

**Execution example**:
```bash
node dist/core/cli.js --client=client-a --env=default --test=auth-flow.ts
```

**Typical pattern**:
```typescript
// Step 1: Setup
const user = createTestUser();

// Step 2: Action
const loginRes = authService.login(user);
if (loginRes.status === 200) {
  // Step 3: Continuation
  const token = extractToken(loginRes);
  // ... more steps
}
```

---

## 3. 🌐 Browser Tests (UI Testing)

**Purpose**: Test browser interactions and validate UI.

**File**: `clients/client-a/scenarios/browser-test.ts`

**Characteristics**:
- Page navigation
- Element interaction (click, type, etc.)
- Screenshot capture
- Web Vitals metrics (FCP, LCP)
- Visible element validation

**Execution example**:
```bash
K6_BROWSER_ENABLED=true node dist/core/cli.js --client=client-a --env=default --test=browser-test.ts
```

**Key metrics**:
- `browser_web_vital_fcp` (First Contentful Paint)
- `browser_web_vital_lcp` (Largest Contentful Paint)
- `browser_web_vital_ttfb` (Time to First Byte)

**Note**: Requires k6 with browser support (k6 v0.43.0+)

---

## 4. 🔀 Mixed Tests (API + Browser)

**Purpose**: Combine API and browser tests in a single scenario.

**File**: `clients/client-a/scenarios/mixed-test.ts`

**Characteristics**:
- Create data via API
- Verify via browser UI
- Cleanup via API
- Complete end-to-end validation

**Execution example**:
```bash
K6_BROWSER_ENABLED=true node dist/core/cli.js --client=client-a --env=default --test=mixed-test.ts
```

**Typical flow**:
```
1. API: Create user/data
2. Browser: Login via UI
3. Browser: Verify data in UI
4. API: Cleanup/logout
```

**Advantages**:
- Realistic complete flow validation
- Combines API speed with UI validation
- Ideal for critical regression tests

---

## Test Types Comparison

| Feature | Unit | Flow | Browser | Mixed |
|---------|------|------|---------|-------|
| **Speed** | ⚡⚡⚡ | ⚡⚡ | ⚡ | ⚡ |
| **Coverage** | Low | Medium | High | Very High |
| **Complexity** | Low | Medium | High | Very High |
| **Resources** | Low | Medium | High | Very High |
| **Typical use** | Smoke tests | User journeys | UI validation | E2E critical paths |

---

## Configuration by Test Type

### Unit Tests
```json
{
  "scenarios": {
    "smoke": {
      "executor": "constant-vus",
      "vus": 10,
      "duration": "30s"
    }
  },
  "thresholds": {
    "http_req_duration": ["p(95)<500"],
    "http_req_failed": ["rate<0.01"]
  }
}
```

### Flow Tests
```json
{
  "scenarios": {
    "user_journey": {
      "executor": "ramping-vus",
      "stages": [
        { "duration": "1m", "target": 5 },
        { "duration": "3m", "target": 5 },
        { "duration": "1m", "target": 0 }
      ]
    }
  },
  "thresholds": {
    "http_req_duration": ["p(95)<2000"],
    "checks": ["rate>0.95"]
  }
}
```

### Browser Tests
```json
{
  "scenarios": {
    "ui_test": {
      "executor": "constant-vus",
      "vus": 1,
      "duration": "5m",
      "options": {
        "browser": {
          "type": "chromium"
        }
      }
    }
  },
  "thresholds": {
    "browser_web_vital_lcp": ["p(95)<4000"],
    "checks": ["rate>0.9"]
  }
}
```

---

## Best Practices

### For Unit Tests
- ✅ Keep tests simple and focused
- ✅ Use strict thresholds
- ✅ Run frequently (CI/CD)

### For Flow Tests
- ✅ Validate each step before continuing
- ✅ Handle errors gracefully
- ✅ Use sleep() appropriately between steps

### For Browser Tests
- ✅ Use stable selectors (data-testid)
- ✅ Capture screenshots at key points
- ✅ Limit VUs (browser tests are expensive)

### For Mixed Tests
- ✅ Use API for setup/cleanup
- ✅ Use Browser only for critical validation
- ✅ Optimize to reduce execution time

---

## When to Use Each Type

### Unit
- ✅ Daily smoke tests
- ✅ Health checks
- ✅ Quick endpoint validation

### Flow
- ✅ Critical user journeys
- ✅ Regression tests
- ✅ Business process validation

### Browser
- ✅ Critical UI validation
- ✅ Accessibility tests
- ✅ Web Vitals verification

### Mixed
- ✅ E2E tests for critical features
- ✅ Pre-release validation
- ✅ Comprehensive smoke tests

---

## 5. 🛠️ Helper Usage

The framework includes powerful helpers to simplify test writing.

### DataHelper (Data Generation)
```typescript
import { DataHelper } from '../../../shared/helpers/DataHelper.js';

// Generate complete user
const user = DataHelper.randomUser();
console.log(user.email, user.name.full);

// Generate specific data
const product = {
  name: DataHelper.randomProduct(),
  price: DataHelper.randomPrice(10, 100),
  sku: DataHelper.randomString(8).toUpperCase()
};

// Generate valid credit card (Luhn)
const creditCard = DataHelper.randomCreditCard();
```

### ValidationHelper (Robust Validations)
```typescript
import { ValidationHelper } from '../../../shared/helpers/ValidationHelper.js';
import { check } from 'k6';

const res = http.get(url);

check(res, {
  // Validate status
  'status is 200': (r) => ValidationHelper.hasStatus(r, 200),
  
  // Validate JSON structure
  'has user id': (r) => ValidationHelper.hasJsonStructure(r, ['id', 'email']),
  
  // Validate response time
  'fast response': (r) => ValidationHelper.isResponseTimeLessThan(r, 500),
  
  // Validate content
  'valid email': (r) => ValidationHelper.isValidEmail(r.json('email')),
  'valid uuid': (r) => ValidationHelper.isValidUUID(r.json('id'))
});
```

### RequestHelper (Request Building)
```typescript
import { RequestHelper } from '../../../shared/helpers/RequestHelper.js';

// Authentication headers
const headers = RequestHelper.buildAuthHeaders(token, 'Bearer');

// Build query string
const query = RequestHelper.buildQueryString({
  page: 1,
  limit: 10,
  sort: 'desc'
});

// Safe JSON value extraction
const userId = RequestHelper.extractValue(res, 'data.users[0].id');
```

### DateHelper (Date Handling)
```typescript
import { DateHelper } from '../../../shared/helpers/DateHelper.js';

// Future date for expiration
const expiryDate = DateHelper.addDays(new Date(), 30);

// ISO format
const isoString = DateHelper.toISOString(expiryDate);

// Check if date is past
const isExpired = DateHelper.isPast(expiryDate);
```
