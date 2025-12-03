# Prometheus Tags for Test Comparison

## Overview

The k6 Enterprise Framework automatically adds custom tags to all Prometheus metrics, enabling powerful filtering and comparison capabilities in Grafana.

## Available Tags

When tests export metrics to Prometheus, the following tags are automatically included:

| Tag | Description | Example Value |
|-----|-------------|---------------|
| `test_name` | Name of the test file (without extension) | `auth-flow` |
| `test_timestamp` | ISO timestamp of test execution | `2025-12-01_17-00-00` |
| `client` | Client name | `examples` |
| `environment` | Environment name | `staging` |

These tags are set automatically via environment variables:
- `K6_TEST_NAME`
- `K6_TEST_TIMESTAMP`
- `K6_CLIENT`
- `K6_ENVIRONMENT`

---

## Configuration

### Enable Prometheus Export

Add Prometheus backend to your config:

**JSON**:
```json
{
  "baseUrl": "https://api.example.com",
  "k6Options": {
    "metricsBackends": [
      {
        "type": "prometheus"
      }
    ]
  }
}
```

**YAML**:
```yaml
baseUrl: https://api.example.com

k6Options:
  metricsBackends:
    - type: prometheus
```

### Prometheus Configuration

Configure Prometheus to scrape k6 metrics:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'k6'
    static_configs:
      - targets: ['localhost:5656']  # k6 Prometheus endpoint
    scrape_interval: 5s
```

---

## Grafana Queries

### Compare Same Test Across Time

Compare the latest execution with previous ones:

```promql
# Response time comparison (last 5 executions)
http_req_duration{
  test_name="auth-flow",
  client="examples",
  quantile="0.95"
}
```

### Compare Different Tests

```promql
# Compare auth-flow vs ecommerce-flow
http_req_duration{
  test_name=~"auth-flow|ecommerce-flow",
  client="examples",
  quantile="0.95"
}
```

### Filter by Environment

```promql
# Production vs Staging
http_req_duration{
  test_name="load-test",
  environment=~"production|staging",
  quantile="0.95"
}
```

### Compare Specific Timestamps

```promql
# Compare two specific test runs
http_req_duration{
  test_name="auth-flow",
  test_timestamp=~"2025-12-01_17-00-00|2025-12-01_16-00-00",
  quantile="0.95"
}
```

### Throughput Comparison

```promql
# Requests per second across tests
rate(http_reqs{
  test_name="auth-flow",
  client="examples"
}[5m])
```

### Error Rate Comparison

```promql
# Error rate percentage
(
  rate(http_req_failed{test_name="auth-flow"}[5m]) /
  rate(http_reqs{test_name="auth-flow"}[5m])
) * 100
```

---

## Grafana Dashboard Examples

### Panel 1: Response Time Trend

**Query**:
```promql
http_req_duration{
  test_name="$test_name",
  client="$client",
  environment="$environment",
  quantile="0.95"
}
```

**Variables**:
- `$test_name`: `label_values(http_req_duration, test_name)`
- `$client`: `label_values(http_req_duration, client)`
- `$environment`: `label_values(http_req_duration, environment)`

### Panel 2: Test Comparison

**Query**:
```promql
# Compare last 5 executions
topk(5, 
  http_req_duration{
    test_name="$test_name",
    quantile="0.95"
  }
) by (test_timestamp)
```

### Panel 3: Multi-Test Overview

**Query**:
```promql
# All tests for a client
http_req_duration{
  client="$client",
  quantile="0.95"
} by (test_name)
```

### Panel 4: Environment Comparison

**Query**:
```promql
# Same test across environments
http_req_duration{
  test_name="$test_name",
  quantile="0.95"
} by (environment)
```

---

## Advanced Queries

### Percentage Change Between Tests

```promql
# Calculate % change from baseline
(
  (
    http_req_duration{
      test_name="auth-flow",
      test_timestamp="2025-12-01_17-00-00",
      quantile="0.95"
    }
    -
    http_req_duration{
      test_name="auth-flow",
      test_timestamp="2025-12-01_16-00-00",
      quantile="0.95"
    }
  )
  /
  http_req_duration{
    test_name="auth-flow",
    test_timestamp="2025-12-01_16-00-00",
    quantile="0.95"
  }
) * 100
```

### Aggregated Metrics Across Tests

```promql
# Average p95 across all tests
avg(
  http_req_duration{
    client="examples",
    quantile="0.95"
  }
) by (test_name)
```

### Detect Regressions

```promql
# Tests where p95 > 500ms
http_req_duration{
  client="examples",
  quantile="0.95"
} > 500
```

---

## Dashboard Template Variables

Create these variables in Grafana for dynamic filtering:

### test_name
```promql
label_values(http_req_duration, test_name)
```

### client
```promql
label_values(http_req_duration, client)
```

### environment
```promql
label_values(http_req_duration, environment)
```

### test_timestamp
```promql
label_values(http_req_duration{test_name="$test_name"}, test_timestamp)
```

---

## Example Dashboard JSON

```json
{
  "dashboard": {
    "title": "k6 Test Comparison",
    "panels": [
      {
        "title": "Response Time (p95) - Last 5 Executions",
        "targets": [
          {
            "expr": "topk(5, http_req_duration{test_name=\"$test_name\", quantile=\"0.95\"}) by (test_timestamp)"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Throughput Comparison",
        "targets": [
          {
            "expr": "rate(http_reqs{test_name=\"$test_name\"}[5m]) by (test_timestamp)"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "(rate(http_req_failed{test_name=\"$test_name\"}[5m]) / rate(http_reqs{test_name=\"$test_name\"}[5m])) * 100"
          }
        ],
        "type": "graph"
      }
    ],
    "templating": {
      "list": [
        {
          "name": "test_name",
          "query": "label_values(http_req_duration, test_name)"
        },
        {
          "name": "client",
          "query": "label_values(http_req_duration, client)"
        },
        {
          "name": "environment",
          "query": "label_values(http_req_duration, environment)"
        }
      ]
    }
  }
}
```

---

## Use Cases

### 1. Compare Test Runs Over Time

Track how performance changes across multiple executions:

```promql
http_req_duration{
  test_name="critical-path",
  client="production",
  quantile="0.95"
}
```

Visualize as time series to see trends.

### 2. A/B Testing

Compare two different implementations:

```promql
# Version A vs Version B
http_req_duration{
  test_name=~"checkout-v1|checkout-v2",
  quantile="0.95"
} by (test_name)
```

### 3. Environment Validation

Ensure staging matches production performance:

```promql
# Production baseline
http_req_duration{
  test_name="load-test",
  environment="production",
  quantile="0.95"
}

# Staging comparison
http_req_duration{
  test_name="load-test",
  environment="staging",
  quantile="0.95"
}
```

### 4. Release Validation

Compare before/after a release:

```promql
# Pre-release (specific timestamp)
http_req_duration{
  test_name="smoke-test",
  test_timestamp="2025-12-01_10-00-00",
  quantile="0.95"
}

# Post-release (latest)
http_req_duration{
  test_name="smoke-test",
  quantile="0.95"
}
```

---

## Best Practices

### 1. Use Consistent Test Names

Keep test names stable across executions:
```bash
# Good
./bin/testing/run-test.sh --client=myapp --test=auth-flow.ts

# Bad (changing names)
./bin/testing/run-test.sh --client=myapp --test=auth-flow-v1.ts
./bin/testing/run-test.sh --client=myapp --test=auth-flow-v2.ts
```

### 2. Tag Important Baselines

Save important timestamps for comparison:
```promql
# Production baseline (save this timestamp)
http_req_duration{
  test_name="load-test",
  test_timestamp="2025-12-01_00-00-00",  # Release baseline
  quantile="0.95"
}
```

### 3. Create Comparison Dashboards

Build dashboards that automatically compare:
- Latest vs Previous
- Latest vs Baseline
- All Environments
- All Tests for a Client

### 4. Set Up Alerts

Alert on regressions:
```promql
# Alert if p95 > 500ms
http_req_duration{
  test_name="critical-path",
  quantile="0.95"
} > 500
```

---

## Troubleshooting

### Tags Not Appearing

**Issue**: Tags not showing in Prometheus

**Solution**: Ensure Prometheus backend is configured in config file
```json
{
  "k6Options": {
    "metricsBackends": [
      {"type": "prometheus"}
    ]
  }
}
```

### Cannot Filter by test_timestamp

**Issue**: test_timestamp not available as label

**Solution**: Ensure you're running with the latest framework version that includes tag support

### Queries Return No Data

**Issue**: No metrics found for specific tags

**Solution**: Verify tags with:
```promql
# List all available test_name values
label_values(http_req_duration, test_name)

# List all available test_timestamp values
label_values(http_req_duration, test_timestamp)
```

---

## Related Documentation

- [Observability](./OBSERVABILITY.md) - Complete observability setup
- [Auto Comparison](./AUTO_COMPARISON.md) - Automatic result comparison
- [CI/CD Integration](./CI_CD_INTEGRATION.md) - Pipeline setup

---

## Summary

✅ **Automatic Tags**: test_name, test_timestamp, client, environment  
✅ **Easy Filtering**: Query by any tag combination  
✅ **Time Comparison**: Compare executions across time  
✅ **Multi-Test Analysis**: Compare different tests  
✅ **Environment Comparison**: Production vs Staging  
✅ **Grafana Ready**: Pre-built query examples  

These tags enable powerful analysis and comparison capabilities in Grafana, making it easy to track performance trends, detect regressions, and validate releases.
