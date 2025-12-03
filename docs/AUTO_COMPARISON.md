# Automatic Performance Comparison

## Overview

The k6 Enterprise Framework includes automatic performance comparison that analyzes your test results against previous executions, identifying trends, improvements, and degradations.

## Features

✅ **Automatic Comparison**: Compares with last 5 executions automatically  
✅ **Top 3 Analysis**: Identifies top 3 improvements and degradations  
✅ **Custom Baselines**: Compare with specific previous results via environment variable  
✅ **Detailed Reports**: Generates markdown comparison reports  
✅ **Trend Detection**: Tracks performance trends over time  
✅ **CI/CD Integration**: Works seamlessly in pipelines  

---

## How It Works

### Automatic Execution

When you run a test, the framework automatically:

1. Executes the test
2. Finds previous results (up to 5 most recent)
3. Compares current results with baselines
4. Identifies top 3 improvements and degradations
5. Generates comparison report
6. Displays summary in console

### Example Output

```bash
./bin/testing/run-test.sh --client=examples --test=auth-flow.ts

# ... test execution ...

🔍 Comparing with previous results...

═══════════════════════════════════════════════════════════════════
📈 TOP 3 IMPROVEMENTS
═══════════════════════════════════════════════════════════════════

1. Response Time (p95)
   Current:  245.30 ms
   Baseline: 312.50 ms (k6-output-20251130-150000.json)
   Change:   -21.51% ✅

2. Throughput
   Current:  156.80 req/s
   Baseline: 142.30 req/s (k6-output-20251130-150000.json)
   Change:   +10.19% ✅

3. Error Rate
   Current:  0.12 %
   Baseline: 0.45 %  (k6-output-20251130-150000.json)
   Change:   -73.33% ✅

═══════════════════════════════════════════════════════════════════
📉 TOP 3 DEGRADATIONS
═══════════════════════════════════════════════════════════════════

   No significant degradations detected ✅

═══════════════════════════════════════════════════════════════════
📊 DETAILED COMPARISON (vs Most Recent Baseline)
═══════════════════════════════════════════════════════════════════

┌─────────────────────────┬──────────────┬──────────────┬──────────┬────────┐
│ Metric                  │ Current      │ Baseline     │ Change   │ Status │
├─────────────────────────┼──────────────┼──────────────┼──────────┼────────┤
│ Response Time (avg)     │ 198.45 ms    │ 215.30 ms    │ -7.83%   │ ✅     │
│ Response Time (p95)     │ 245.30 ms    │ 312.50 ms    │ -21.51%  │ ✅     │
│ Response Time (p99)     │ 289.10 ms    │ 356.20 ms    │ -18.84%  │ ✅     │
│ Throughput              │ 156.80 req/s │ 142.30 req/s │ +10.19%  │ ✅     │
│ Error Rate              │ 0.12 %       │ 0.45 %       │ -73.33%  │ ✅     │
│ Check Pass Rate         │ 99.88 %      │ 99.55 %      │ +0.33%   │ ➡️     │
│ Iterations              │ 4704         │ 4269         │ +10.19%  │ ✅     │
│ Virtual Users (max)     │ 10           │ 10           │ +0.00%   │ ➡️     │
└─────────────────────────┴──────────────┴──────────────┴──────────┴────────┘

═══════════════════════════════════════════════════════════════════
📄 Comparison report saved: reports/examples/auth-flow/comparison-1733078400000.md
═══════════════════════════════════════════════════════════════════

✅ Performance comparison complete
```

---

## Configuration

### Environment Variables

#### MAX_HISTORY
Maximum number of historical results to compare (default: 5)

```bash
MAX_HISTORY=10 ./bin/testing/run-test.sh --client=examples --test=auth-flow.ts
```

#### COMPARE_WITH
Comma-separated list of specific result files to compare

```bash
COMPARE_WITH="k6-output-20251130-150000.json,k6-output-20251129-140000.json,k6-output-20251128-130000.json" \
  ./bin/testing/run-test.sh --client=examples --test=auth-flow.ts
```

---

## Manual Comparison

You can also run comparisons manually:

```bash
# Compare with last 5 executions
node bin/testing/auto-compare.js --client=examples --test=auth-flow

# With custom history limit
MAX_HISTORY=10 node bin/testing/auto-compare.js --client=examples --test=auth-flow

# With specific baselines
COMPARE_WITH="k6-output-20251130-150000.json,k6-output-20251129-140000.json" \
  node bin/testing/auto-compare.js --client=examples --test=auth-flow
```

---

## Comparison Report

Each comparison generates a markdown report saved to:
```
reports/{client}/{test}/comparison-{timestamp}.md
```

### Report Contents

```markdown
# Performance Comparison Report

**Client**: examples
**Test**: auth-flow
**Date**: 2025-12-01T17:00:00.000Z
**Current Result**: k6-output-20251201-170000.json

## Baselines Compared

1. k6-output-20251130-150000.json
2. k6-output-20251129-140000.json
3. k6-output-20251128-130000.json

## Top 3 Improvements

### 1. Response Time (p95)

- **Current**: 245.30 ms
- **Baseline**: 312.50 ms (k6-output-20251130-150000.json)
- **Change**: -21.51% ✅

### 2. Throughput

- **Current**: 156.80 req/s
- **Baseline**: 142.30 req/s (k6-output-20251130-150000.json)
- **Change**: +10.19% ✅

### 3. Error Rate

- **Current**: 0.12 %
- **Baseline**: 0.45 % (k6-output-20251130-150000.json)
- **Change**: -73.33% ✅

## Top 3 Degradations

No significant degradations detected. ✅

## Detailed Comparison

| Metric | Current | Baseline | Change | Status |
|--------|---------|----------|--------|--------|
| Response Time (avg) | 198.45 ms | 215.30 ms | -7.83% | ✅ |
| Response Time (p95) | 245.30 ms | 312.50 ms | -21.51% | ✅ |
| ... | ... | ... | ... | ... |
```

---

## Metrics Analyzed

The comparison analyzes the following metrics:

| Metric | Description | Lower is Better |
|--------|-------------|-----------------|
| Response Time (avg) | Average response time | ✅ |
| Response Time (p95) | 95th percentile response time | ✅ |
| Response Time (p99) | 99th percentile response time | ✅ |
| Throughput | Requests per second | ❌ (higher is better) |
| Error Rate | Percentage of failed requests | ✅ |
| Check Pass Rate | Percentage of passed checks | ❌ (higher is better) |
| Iterations | Total iterations completed | ❌ (higher is better) |
| Virtual Users (max) | Maximum concurrent VUs | - |

---

## Thresholds

### Improvement/Degradation Detection

- **Minimum Change**: 1% (changes below 1% are not reported)
- **Significant Change**: 5% (highlighted in detailed comparison)
- **Critical Degradation**: 10% (causes warning exit code)

### Status Indicators

- ✅ **Improvement**: Metric improved by >5%
- ❌ **Degradation**: Metric degraded by >5%
- ➡️ **Stable**: Change is <5%

---

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Test with Comparison
  env:
    MAX_HISTORY: 10
  run: |
    ./bin/testing/run-test.sh \
      --client=${{ github.event.inputs.client }} \
      --test=${{ github.event.inputs.test }}

- name: Upload Comparison Reports
  uses: actions/upload-artifact@v3
  with:
    name: comparison-reports
    path: reports/**/comparison-*.md
```

### GitLab CI

```yaml
run:test:with:comparison:
  script:
    - export MAX_HISTORY=10
    - ./bin/testing/run-test.sh --client=examples --test=auth-flow.ts
  artifacts:
    paths:
      - reports/**/comparison-*.md
    expire_in: 30 days
```

---

## Use Cases

### 1. Performance Regression Detection

Automatically detect when performance degrades:

```bash
./bin/testing/run-test.sh --client=myapp --test=critical-flow.ts
# Exits with code 1 if degradation >10%
```

### 2. Release Validation

Compare release candidate against production baseline:

```bash
# Run test and save baseline
./bin/testing/run-test.sh --client=myapp --env=production --test=load-test.ts

# Later, compare RC against production
COMPARE_WITH="k6-output-production-baseline.json" \
  ./bin/testing/run-test.sh --client=myapp --env=rc --test=load-test.ts
```

### 3. Optimization Tracking

Track improvements from optimization efforts:

```bash
# Before optimization
./bin/testing/run-test.sh --client=myapp --test=api-test.ts

# After optimization
./bin/testing/run-test.sh --client=myapp --test=api-test.ts
# Shows improvements automatically
```

### 4. Trend Analysis

Monitor performance trends over time:

```bash
# Run daily in CI/CD
MAX_HISTORY=30 ./bin/testing/run-test.sh --client=myapp --test=daily-check.ts
```

---

## Best Practices

### 1. Consistent Test Conditions

Ensure consistent conditions for accurate comparisons:
- Same VU count
- Same duration
- Same environment
- Same data set

### 2. Baseline Management

Keep important baselines:

```bash
# Save production baseline
cp reports/myapp/load-test/k6-output-latest.json \
   reports/myapp/load-test/baseline-production-v1.0.json

# Compare against it
COMPARE_WITH="baseline-production-v1.0.json" \
  ./bin/testing/run-test.sh --client=myapp --test=load-test.ts
```

### 3. Archive Comparison Reports

```bash
# Archive reports for historical analysis
tar -czf comparison-reports-$(date +%Y%m).tar.gz \
  reports/**/comparison-*.md
```

### 4. Set Appropriate Thresholds

Adjust thresholds based on your SLAs:

```javascript
// In test file
export const options = {
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 500ms SLA
    'http_req_failed': ['rate<0.01'],   // 1% error rate
  }
};
```

---

## Troubleshooting

### Issue: No Previous Results Found

**Cause**: First execution of the test

**Solution**: Run the test at least twice to enable comparison
```bash
./bin/testing/run-test.sh --client=examples --test=auth-flow.ts
# Run again
./bin/testing/run-test.sh --client=examples --test=auth-flow.ts
```

### Issue: Comparison Shows Unexpected Changes

**Cause**: Different test conditions

**Solution**: Ensure consistent test parameters
- Check VU count
- Check duration
- Check environment
- Check data

### Issue: COMPARE_WITH File Not Found

**Cause**: Incorrect filename or path

**Solution**: Use full filename from reports directory
```bash
ls reports/examples/auth-flow/k6-output-*.json
# Use exact filename
COMPARE_WITH="k6-output-20251201-170000.json" ...
```

---

## Advanced Usage

### Compare Across Environments

```bash
# Production baseline
PROD_BASELINE="k6-output-prod-20251201.json"

# Run in staging and compare
COMPARE_WITH="$PROD_BASELINE" \
  ./bin/testing/run-test.sh --client=myapp --env=staging --test=load-test.ts
```

### Automated Regression Alerts

```bash
#!/bin/bash
# regression-check.sh

./bin/testing/run-test.sh --client=myapp --test=critical-path.ts

if [ $? -ne 0 ]; then
  # Send alert
  curl -X POST https://hooks.slack.com/... \
    -d '{"text":"⚠️ Performance regression detected!"}'
fi
```

### Historical Trend Report

```bash
# Generate trend report from last 30 executions
MAX_HISTORY=30 node bin/testing/auto-compare.js \
  --client=myapp \
  --test=daily-check
```

---

## Related Documentation

- [Running Tests](./RUNNING_TESTS.md) - Test execution guide
- [CI/CD Integration](./CI_CD_INTEGRATION.md) - Pipeline setup
- [Examples](./EXAMPLES.md) - Example scenarios

---

## Summary

✅ **Automatic**: Runs after every test execution  
✅ **Intelligent**: Identifies top 3 changes automatically  
✅ **Flexible**: Custom baselines via environment variables  
✅ **Detailed**: Comprehensive markdown reports  
✅ **CI/CD Ready**: Seamless pipeline integration  
✅ **Actionable**: Clear indicators for improvements/degradations  

The automatic performance comparison helps you catch regressions early, track improvements, and maintain performance SLAs across your application.
