# Configuration Validation Guide

## Overview

The k6 Enterprise Framework includes comprehensive configuration validation using JSON Schema. This ensures your configuration files are correct before running tests, catching errors early and providing helpful error messages.

## Features

- ✅ **JSON Schema Validation**: Validates against a comprehensive schema
- ✅ **Multi-Format Support**: Works with both JSON and YAML configurations
- ✅ **Auto-Detection**: Automatically detects file format
- ✅ **Format Conversion**: Convert between JSON and YAML
- ✅ **CLI Tool**: Easy-to-use command-line interface
- ✅ **Detailed Error Messages**: Clear, actionable error messages
- ✅ **Example Generation**: Generate valid example configurations

## Supported Formats

### JSON Configuration
```json
{
  "baseUrl": "https://api.example.com",
  "scenarios": {
    "default": {
      "executor": "constant-vus",
      "vus": 10,
      "duration": "30s"
    }
  },
  "thresholds": {
    "http_req_duration": ["p(95)<500"],
    "checks": ["rate>0.95"]
  }
}
```

### YAML Configuration
```yaml
baseUrl: https://api.example.com

scenarios:
  default:
    executor: constant-vus
    vus: 10
    duration: 30s

thresholds:
  http_req_duration:
    - p(95)<500
  checks:
    - rate>0.95
```

## CLI Usage

### Validate Configuration File

```bash
# Validate JSON config
node bin/cli/validate-config.js --file clients/examples/config/default.json

# Validate YAML config
node bin/cli/validate-config.js --file clients/examples/config/example.yaml

# Validate by client and environment
node bin/cli/validate-config.js --client examples --env default
```

### Generate Example Configuration

```bash
# Generate JSON example
node bin/cli/validate-config.js --example

# Generate YAML example
node bin/cli/validate-config.js --example --format yaml
```

### Convert Between Formats

```bash
# Convert JSON to YAML
node bin/cli/validate-config.js --file config.json --convert --format yaml > config.yaml

# Convert YAML to JSON
node bin/cli/validate-config.js --file config.yaml --convert --format json > config.json
```

## Programmatic Usage

### Validate Configuration Object

```typescript
import { ConfigValidator } from './shared/validators/ConfigValidator.js';

const config = {
  baseUrl: 'https://api.example.com',
  scenarios: {
    default: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s'
    }
  }
};

const result = ConfigValidator.validate(config);

if (result.valid) {
  console.log('✅ Configuration is valid');
} else {
  console.error('❌ Validation errors:');
  result.errors.forEach(err => console.error(`  - ${err}`));
}
```

### Validate Configuration File

```typescript
import { ConfigValidator } from './shared/validators/ConfigValidator.js';

// Supports both JSON and YAML
const result = ConfigValidator.validateFile('clients/examples/config/default.json');

if (result.valid) {
  console.log('✅ Configuration is valid');
  console.log('Config:', result.config);
} else {
  console.error('❌ Validation errors:', result.errors);
}
```

### Validate and Throw

```typescript
import { ConfigValidator } from './shared/validators/ConfigValidator.js';

try {
  ConfigValidator.validateOrThrow(config);
  console.log('✅ Configuration is valid');
} catch (error) {
  console.error('❌ Invalid configuration:', error.message);
}
```

## Configuration Schema

The framework validates against a comprehensive JSON Schema that defines:

### Required Fields

- `baseUrl` (string, URI format): Base URL for the API under test

### Optional Fields

#### Scenarios
```yaml
scenarios:
  scenario_name:
    executor: constant-vus | ramping-vus | constant-arrival-rate | ramping-arrival-rate | shared-iterations | per-vu-iterations
    vus: 10              # Number of virtual users
    duration: 30s        # Test duration
    iterations: 100      # Total iterations (for iteration-based executors)
    stages:              # For ramping executors
      - target: 10
        duration: 30s
```

#### Thresholds
```yaml
thresholds:
  http_req_duration:
    - p(95)<500
    - p(99)<1000
  http_req_failed:
    - rate<0.01
  checks:
    - rate>0.95
```

#### Tags
```yaml
tags:
  environment: staging
  team: qa
  version: v1.0.0
```

#### Authentication
```yaml
auth:
  type: bearer | basic | oauth2 | apikey
  token: your-token-here
  username: user          # For basic auth
  password: pass          # For basic auth
  apiKey: key            # For API key auth
  apiKeyHeader: X-API-Key # Header name for API key
```

#### Headers
```yaml
headers:
  User-Agent: k6-enterprise-framework/1.0
  Accept: application/json
  Authorization: Bearer ${TOKEN}
```

#### Timeout
```yaml
timeout: 30s
```

#### Retries
```yaml
retries:
  maxRetries: 3
  backoffMultiplier: 2
  initialDelay: 100
```

## Validation Rules

### Base URL
- Must be a valid URI
- Required field

### Scenarios
- At least one scenario should be defined
- Each scenario must have an `executor`
- Valid executors: `constant-vus`, `ramping-vus`, `constant-arrival-rate`, `ramping-arrival-rate`, `shared-iterations`, `per-vu-iterations`, `externally-controlled`
- Duration must match pattern: `[0-9]+(s|m|h)`
- VUs must be positive integers

### Thresholds
- Threshold expressions must be valid k6 syntax
- Examples: `p(95)<500`, `rate<0.01`, `count>100`

### Browser Options
```yaml
scenarios:
  browser_test:
    executor: shared-iterations
    options:
      browser:
        type: chromium | firefox
```

## Error Messages

The validator provides detailed, actionable error messages:

```
❌ Configuration validation failed:

   - /scenarios/default/executor: must be equal to one of the allowed values ({"allowedValues":["constant-vus","ramping-vus","constant-arrival-rate","ramping-arrival-rate","shared-iterations","per-vu-iterations","externally-controlled"]})
   - /scenarios/default/duration: must match pattern "^[0-9]+(s|m|h)$"
   - /thresholds/http_req_duration: must be array
```

## Best Practices

### 1. Validate Before Running Tests

Always validate your configuration before running tests:

```bash
# Validate first
node bin/cli/validate-config.js --client myapp --env staging

# Then run tests
./bin/testing/run-test.sh --client myapp --env staging --test my-test.ts
```

### 2. Use YAML for Readability

YAML is more readable and supports comments:

```yaml
# Production configuration
baseUrl: https://api.production.com

scenarios:
  # Smoke test - quick validation
  smoke:
    executor: constant-vus
    vus: 1
    duration: 1m
  
  # Load test - sustained load
  load:
    executor: constant-vus
    vus: 50
    duration: 10m
```

### 3. Environment-Specific Configs

Create separate configs for each environment:

```
clients/myapp/config/
  ├── default.yaml      # Development
  ├── staging.yaml      # Staging
  └── production.yaml   # Production
```

### 4. Use Environment Variables

Reference environment variables in configs:

```yaml
baseUrl: ${API_BASE_URL}

auth:
  type: bearer
  token: ${API_TOKEN}

headers:
  X-API-Key: ${API_KEY}
```

### 5. Version Control

Commit your configuration files to version control:

```bash
git add clients/*/config/*.yaml
git commit -m "feat: add staging configuration"
```

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Validate Configuration
  run: |
    node bin/cli/validate-config.js --client myapp --env staging
    
- name: Run Tests
  run: |
    ./bin/testing/run-test.sh --client myapp --env staging --test smoke.ts
```

### GitLab CI

```yaml
validate-config:
  script:
    - node bin/cli/validate-config.js --client myapp --env staging
    
run-tests:
  script:
    - ./bin/testing/run-test.sh --client myapp --env staging --test smoke.ts
  dependencies:
    - validate-config
```

## Troubleshooting

### Common Validation Errors

**Error**: `baseUrl: must match format "uri"`
```
Solution: Ensure baseUrl is a valid URI (e.g., https://api.example.com)
```

**Error**: `scenarios/default/executor: must be equal to one of the allowed values`
```
Solution: Use a valid executor type: constant-vus, ramping-vus, etc.
```

**Error**: `scenarios/default/duration: must match pattern "^[0-9]+(s|m|h)$"`
```
Solution: Use valid duration format: 30s, 5m, 1h
```

**Error**: `thresholds/http_req_duration: must be array`
```
Solution: Thresholds must be arrays of strings:
thresholds:
  http_req_duration:
    - p(95)<500
```

### Module Not Found

If you get "ConfigValidator not found":

```bash
# Build the project first
npm run build

# Then validate
node bin/cli/validate-config.js --file config.yaml
```

## Schema Reference

Full schema available at: `shared/schemas/config.schema.json`

View schema:
```bash
cat shared/schemas/config.schema.json | jq
```

## Examples

### Complete Example (YAML)

See: `clients/examples/config/example.yaml`

### Complete Example (JSON)

```bash
node bin/cli/validate-config.js --example > example-config.json
```

## Related Documentation

- [Client Management](./CLIENT_MANAGEMENT.md) - Managing test clients
- [CI/CD Integration](./CI_CD_INTEGRATION.md) - CI/CD setup
- [Examples](./EXAMPLES.md) - Example test scenarios
