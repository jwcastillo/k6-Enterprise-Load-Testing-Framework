# Running Tests Guide

This guide explains the different ways to run tests in the k6 Enterprise Load Testing Framework.

## 🎯 Recommended Method: run-test.sh Wrapper

The **preferred way** to run tests is using the `run-test.sh` wrapper script. This script provides:

- ✅ Automatic configuration validation
- ✅ Automatic project build
- ✅ Beautiful test summaries with emojis
- ✅ Performance comparison with previous runs
- ✅ Proper error handling and exit codes
- ✅ Support for load profiles (smoke, load, stress, spike)

### Basic Usage

```bash
./bin/testing/run-test.sh --client=latam --test=example.ts
```

### With Environment

```bash
./bin/testing/run-test.sh --client=latam --test=example.ts --env=staging
```

### With Load Profile

```bash
./bin/testing/run-test.sh --client=latam --test=example.ts --profile=smoke
```

Available profiles:
- `smoke` - Quick validation (low load)
- `load` - Normal load testing
- `stress` - High load testing
- `spike` - Sudden traffic spikes

### Help

```bash
./bin/testing/run-test.sh --help
```

## 🔧 Alternative: Direct CLI Usage

For advanced use cases or when you need more control, you can use the CLI directly:

```bash
node dist/core/cli.js --client=latam --test=example.ts --env=default
```

### When to use direct CLI:

- Custom k6 options not supported by the wrapper
- Integration with other tools
- Debugging specific issues
- CI/CD pipelines with custom requirements

## 📊 Understanding Test Output

### run-test.sh Output

The wrapper script provides a beautiful, colorized summary:

```
╔════════════════════════════════════════════════════════════════╗
║           🚀 k6 ENTERPRISE TEST RESULTS 🚀                     ║
╚════════════════════════════════════════════════════════════════╝

📊 Test Information:
   Client:    latam
   Test:      example
   Duration:  30.5s

✅ Status: PASSED
💬 🎉 ¡Épico! Todo pasó como mantequilla

📈 Metrics Summary:
   ✓ Checks Passed:    150 / 150 (100.0%)
   🔄 HTTP Requests:   1500
   🔁 Iterations:      150

📁 Generated Files:
   ✓ JSON Output:       k6-output-20231203-143022.json
   ✓ k6 Dashboard:      k6-dashboard-20231203-143022.html
   ✓ Enterprise Report: enterprise-report-20231203-143022.html
   ✓ Summary:           k6-summary-20231203-143022.txt

📂 Report Directory: reports/latam/example/20231203-143022

╔════════════════════════════════════════════════════════════════╗
║  ✅  ALL TESTS PASSED - READY TO DEPLOY! ✅                    ║
╚════════════════════════════════════════════════════════════════╝
```

### Features of the Summary

- **Random Fun Messages**: Different messages for passed/failed tests
- **Color-Coded Status**: Green for success, red for failures
- **Detailed Metrics**: Checks, HTTP requests, iterations
- **File Listing**: All generated reports and artifacts
- **Performance Comparison**: Automatic comparison with previous runs (if available)

## 🚀 CI/CD Integration

### GitLab CI

The framework's `.gitlab-ci.yml` uses `run-test.sh` for all test executions:

```yaml
test:smoke:
  stage: test
  script:
    - chmod +x bin/testing/run-test.sh
    - ./bin/testing/run-test.sh --client="examples" --test="example.ts" --env="default"
```

### GitHub Actions

The `.github/workflows/ci.yml` also uses the wrapper:

```yaml
- name: Run Smoke Test
  run: |
    chmod +x bin/testing/run-test.sh
    ./bin/testing/run-test.sh --client="examples" --test="example.ts" --env="default"
```

## 📝 Examples

### Quick Smoke Test

```bash
./bin/testing/run-test.sh --client=examples --test=example.ts --profile=smoke
```

### Load Test with Staging Environment

```bash
./bin/testing/run-test.sh --client=examples --test=checkout-flow.ts --env=staging --profile=load
```

### Stress Test

```bash
./bin/testing/run-test.sh --client=examples --test=api-endpoints.ts --profile=stress
```

### Browser Test (requires K6_BROWSER_ENABLED)

```bash
K6_BROWSER_ENABLED=true ./bin/testing/run-test.sh --client=examples --test=browser-test.ts
```

## 🐳 Running Tests with Docker

The framework includes Docker support with the same `run-test.sh` wrapper as the entrypoint.

### Using Docker Compose (Recommended)

Docker Compose automatically sets up Redis and the k6 runner:

```bash
# Basic usage
docker-compose run k6-runner --client=examples --test=example.ts

# With custom environment
CLIENT=examples TEST=example.ts ENV=staging docker-compose run k6-runner

# With load profile
docker-compose run k6-runner --client=examples --test=example.ts --profile=smoke

# Clean up after tests
docker-compose down
```

### Using Docker Directly

```bash
# Build the image
docker build -t k6-runner .

# Run a test (reports will be saved in the container)
docker run k6-runner --client=latam --test=example.ts

# Run with volume mount to save reports locally
docker run -v $(pwd)/reports:/app/reports k6-runner --client=latam --test=example.ts

# Run with environment variables
docker run -e K6_DEBUG=true k6-runner --client=latam --test=example.ts
```

### Docker with Redis

When using Docker Compose, Redis is automatically available:

```bash
# The REDIS_URL is automatically set to redis://redis:6379
docker-compose run k6-runner --client=latam --test=redis-test.ts
```

### Benefits of Docker

- ✅ Consistent environment across all machines
- ✅ No need to install Node.js or k6 locally
- ✅ Automatic Redis setup with docker-compose
- ✅ Easy CI/CD integration
- ✅ Isolated test execution

## 🔍 Troubleshooting

### Script Not Executable

```bash
chmod +x bin/testing/run-test.sh
```

### Configuration Validation Failed

The wrapper automatically validates your configuration. Fix the errors shown before running the test.

### Build Errors

The wrapper runs `npm run build` automatically. Ensure your TypeScript code compiles without errors.

## 📚 Related Documentation

- [Test Types](TEST_TYPES.md) - Different types of tests supported
- [Configuration](../README.md#-configuration) - How to configure tests
- [CI/CD Integration](CI_CD_INTEGRATION.md) - Running tests in pipelines
- [Examples](EXAMPLES.md) - Complete example scenarios
