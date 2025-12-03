# Running Multiple Tests

## Overview

The k6 Enterprise Framework supports running multiple tests in various ways, with organized results for each execution.

## Methods to Run Multiple Tests

### 1. Run All Tests in a Client Directory

**Script**: `bin/testing/run-all-tests.sh`

```bash
# Run all tests for a client
./bin/testing/run-all-tests.sh --client=examples

# With specific environment
./bin/testing/run-all-tests.sh --client=examples --env=staging

# With custom concurrency
./bin/testing/run-all-tests.sh --client=examples --concurrency=2

# With pattern filter
./bin/testing/run-all-tests.sh --client=examples --pattern="auth*.ts"
```

**Features**:
- ✅ Automatic config validation
- ✅ Parallel execution
- ✅ Organized results
- ✅ Summary report generation
- ✅ Individual test reports

---

### 2. Run Tests with Pattern Matching

**Script**: `bin/testing/run-parallel.js`

```bash
# Run all tests matching pattern
node bin/testing/run-parallel.js \
  --client=examples \
  --tests="clients/examples/scenarios/*.ts" \
  --concurrency=4

# Run specific test group
node bin/testing/run-parallel.js \
  --client=examples \
  --tests="clients/examples/scenarios/benchmark-*.ts"

# Run with environment
node bin/testing/run-parallel.js \
  --client=examples \
  --env=staging \
  --tests="clients/examples/scenarios/*.ts"
```

---

### 3. Run Tests Sequentially

**Using bash loop**:

```bash
# Run all tests one by one
for test in clients/examples/scenarios/*.ts; do
  ./bin/testing/run-test.sh \
    --client=examples \
    --test=$(basename $test)
done
```

---

## Results Organization

### Directory Structure

When running multiple tests, results are organized as follows:

```
reports/
└── {client}/
    ├── all-tests-{timestamp}/          # Batch execution summary
    │   ├── summary.md                  # Summary report
    │   └── execution.log               # Execution logs
    │
    ├── {test-name-1}/                  # Individual test results
    │   ├── k6-output-{timestamp}.json
    │   ├── k6-dashboard-{timestamp}.html
    │   ├── custom-report-{timestamp}.html
    │   └── k6-execution-{timestamp}.log
    │
    ├── {test-name-2}/
    │   ├── k6-output-{timestamp}.json
    │   ├── k6-dashboard-{timestamp}.html
    │   ├── custom-report-{timestamp}.html
    │   └── k6-execution-{timestamp}.log
    │
    └── ...
```

### Example: Running All Examples

```bash
./bin/testing/run-all-tests.sh --client=examples
```

**Results**:
```
reports/examples/
├── all-tests-20251201-170000/
│   ├── summary.md
│   └── execution.log
├── auth-flow/
│   ├── k6-output-20251201-170001.json
│   ├── k6-dashboard-20251201-170001.html
│   └── custom-report-20251201-170001.html
├── benchmark-baseline/
│   ├── k6-output-20251201-170002.json
│   ├── k6-dashboard-20251201-170002.html
│   └── custom-report-20251201-170002.html
├── ecommerce-flow/
│   ├── k6-output-20251201-170003.json
│   ├── k6-dashboard-20251201-170003.html
│   └── custom-report-20251201-170003.html
└── ... (all other tests)
```

---

## Summary Report

The `summary.md` file generated in the batch execution directory contains:

```markdown
# Test Execution Summary

## Configuration
- **Client**: examples
- **Environment**: default
- **Date**: 2025-12-01 17:00:00
- **Tests Found**: 13
- **Concurrency**: 4
- **Pattern**: *.ts

## Results

See `execution.log` for detailed output.

## Individual Test Reports

- [auth-flow](../../auth-flow/k6-dashboard-20251201-170001.html)
- [benchmark-baseline](../../benchmark-baseline/k6-dashboard-20251201-170002.html)
- [ecommerce-flow](../../ecommerce-flow/k6-dashboard-20251201-170003.html)
- ... (links to all test reports)
```

---

## Execution Output

### Console Output Example

```
╔═══════════════════════════════════════════════════════╗
║           Running All Tests for Client: examples       ║
╚═══════════════════════════════════════════════════════╝

Client:       examples
Environment:  default
Tests Found:  13
Concurrency:  4
Pattern:      *.ts

🚀 Starting test execution...

▶️  Starting: auth-flow.ts
▶️  Starting: benchmark-baseline.ts
▶️  Starting: browser-test.ts
▶️  Starting: contract-testing.ts
✅ Finished: benchmark-baseline.ts (PASS)
▶️  Starting: ecommerce-flow.ts
✅ Finished: contract-testing.ts (PASS)
▶️  Starting: example.ts
✅ Finished: auth-flow.ts (PASS)
▶️  Starting: file-upload.ts
...

==================================================
📊 PARALLEL EXECUTION SUMMARY
==================================================
Total Tests: 13
Passed:      13
Failed:      0
Duration:    45.23s
==================================================
✅ auth-flow.ts
✅ benchmark-baseline.ts
✅ benchmark-heavy-load.ts
✅ browser-screenshot-test.ts
✅ browser-test.ts
✅ contract-testing.ts
✅ ecommerce-flow.ts
✅ example.ts
✅ file-upload.ts
✅ graphql-testing.ts
✅ mixed-test.ts
✅ rate-limiting.ts
✅ websocket-testing.ts

╔═══════════════════════════════════════════════════════╗
║                  Results Location                      ║
╚═══════════════════════════════════════════════════════╝

Summary:      reports/examples/all-tests-20251201-170000/summary.md
Logs:         reports/examples/all-tests-20251201-170000/execution.log
Reports:      reports/examples/<test-name>/

✅ All tests passed!
```

---

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run All Tests
  run: |
    ./bin/testing/run-all-tests.sh \
      --client=${{ github.event.inputs.client }} \
      --env=${{ github.event.inputs.env }} \
      --concurrency=4

- name: Upload All Reports
  uses: actions/upload-artifact@v3
  with:
    name: all-test-reports
    path: reports/${{ github.event.inputs.client }}/
```

### GitLab CI

```yaml
run:all:tests:
  script:
    - ./bin/testing/run-all-tests.sh --client=examples --env=staging
  artifacts:
    paths:
      - reports/examples/
    expire_in: 7 days
```

---

## Advanced Usage

### Filter by Pattern

```bash
# Run only benchmark tests
./bin/testing/run-all-tests.sh \
  --client=examples \
  --pattern="benchmark-*.ts"

# Run only browser tests
./bin/testing/run-all-tests.sh \
  --client=examples \
  --pattern="browser-*.ts"

# Run only API tests (exclude browser)
./bin/testing/run-all-tests.sh \
  --client=examples \
  --pattern="!(browser|mixed)*.ts"
```

### Control Concurrency

```bash
# Run tests sequentially (one at a time)
./bin/testing/run-all-tests.sh --client=examples --concurrency=1

# Run with maximum parallelism
./bin/testing/run-all-tests.sh --client=examples --concurrency=10
```

### Environment-Specific Runs

```bash
# Run all tests in staging
./bin/testing/run-all-tests.sh --client=myapp --env=staging

# Run all tests in production
./bin/testing/run-all-tests.sh --client=myapp --env=production
```

---

## Best Practices

### 1. Use Appropriate Concurrency

- **CPU-bound tests**: Use `concurrency = CPU cores`
- **I/O-bound tests**: Use `concurrency = 2-4x CPU cores`
- **Browser tests**: Use `concurrency = 1-2` (resource intensive)

### 2. Organize Tests by Type

```
clients/myapp/scenarios/
├── api/
│   ├── auth-*.ts
│   ├── user-*.ts
│   └── order-*.ts
├── browser/
│   ├── login-*.ts
│   └── checkout-*.ts
└── integration/
    └── end-to-end-*.ts
```

Then run by directory:
```bash
./bin/testing/run-all-tests.sh --client=myapp --pattern="api/*.ts"
```

### 3. Archive Results

```bash
# Create timestamped archive
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
tar -czf "test-results-$TIMESTAMP.tar.gz" reports/examples/

# Upload to storage
aws s3 cp "test-results-$TIMESTAMP.tar.gz" s3://my-bucket/test-results/
```

### 4. Monitor Long-Running Suites

```bash
# Run in background and monitor
./bin/testing/run-all-tests.sh --client=examples > test-run.log 2>&1 &

# Watch progress
tail -f test-run.log
```

---

## Troubleshooting

### Issue: Tests Failing Due to Resource Limits

**Solution**: Reduce concurrency
```bash
./bin/testing/run-all-tests.sh --client=examples --concurrency=2
```

### Issue: Reports Not Generated

**Solution**: Check individual test logs
```bash
cat reports/examples/test-name/k6-execution-*.log
```

### Issue: Out of Memory

**Solution**: Run tests sequentially
```bash
./bin/testing/run-all-tests.sh --client=examples --concurrency=1
```

### Issue: Config Validation Fails

**Solution**: Validate config first
```bash
node bin/cli/validate-config.js --client=examples --env=default
```

---

## Comparison: Single vs Multiple Test Execution

| Feature | Single Test | Multiple Tests |
|---------|-------------|----------------|
| **Command** | `run-test.sh` | `run-all-tests.sh` |
| **Execution** | Sequential | Parallel |
| **Results** | Single directory | Multiple directories + summary |
| **Duration** | Test duration | Parallelized duration |
| **Use Case** | Development, debugging | CI/CD, regression testing |

---

## Related Documentation

- [Examples](./EXAMPLES.md) - Individual test scenarios
- [CI/CD Integration](./CI_CD_INTEGRATION.md) - Pipeline setup
- [Configuration](./CONFIG_VALIDATION.md) - Config management

---

## Summary

✅ **Multiple execution methods** - run-all-tests.sh, run-parallel.js, bash loops  
✅ **Organized results** - Separate directories per test + batch summary  
✅ **Parallel execution** - Configurable concurrency  
✅ **Pattern matching** - Filter tests by name  
✅ **Summary reports** - Markdown summary with links to all reports  
✅ **CI/CD ready** - Easy integration with pipelines  

The framework provides flexible options for running multiple tests while maintaining clear, organized results for easy analysis and reporting.
