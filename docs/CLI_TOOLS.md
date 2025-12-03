# Framework CLI Tools & Executables

## Overview

The k6 Enterprise Framework includes a comprehensive set of command-line tools for testing, reporting, client management, and more.

## Directory Structure

```
bin/
├── cli/                    # CLI utilities
│   ├── generate.js        # Generate new clients, tests, services
│   ├── validate-config.js # Validate configuration files
│   └── create-client.sh   # Create new client structure
├── testing/               # Test execution tools
│   ├── run-test.sh       # Run single test
│   ├── run-all-tests.sh  # Run all tests in client
│   ├── run-parallel.js   # Run tests in parallel
│   ├── auto-compare.js   # Auto-compare results
│   ├── compare-results.js # Compare two results
│   └── mock-server.js    # Mock API server
├── reporting/             # Reporting tools
│   ├── report.js         # Generate enterprise report
│   ├── notify.js         # Send notifications
│   ├── trend-analysis.js # Analyze trends
│   └── test-summary.sh   # Generate test summary
└── version.sh            # Version management
```

---

## CLI Utilities

### 1. generate.js

**Purpose**: Interactive generator for clients, tests, services, and factories

**Usage**:
```bash
# Interactive mode
npm run generate

# Or directly
node bin/cli/generate.js
```

**Options**:
1. Create new client
2. Create new test scenario
3. Create new service
4. Create new data factory

**Example**:
```bash
$ npm run generate

? What would you like to generate? Create new client
? Client name: myapp
? Client description: My Application Tests
✅ Client created at: clients/myapp
```

**Output**:
- Creates complete client structure
- Generates config files
- Creates example test
- Sets up service template

---

### 2. validate-config.js

**Purpose**: Validate configuration files against JSON Schema

**Usage**:
```bash
# Validate by client and environment
node bin/cli/validate-config.js --client=examples --env=default

# Validate specific file
node bin/cli/validate-config.js --file=clients/examples/config/default.json

# Generate example config
node bin/cli/validate-config.js --example

# Generate YAML example
node bin/cli/validate-config.js --example --format=yaml

# Convert JSON to YAML
node bin/cli/validate-config.js --file=config.json --convert --format=yaml
```

**Options**:
- `--client=<name>` - Client name
- `--env=<name>` - Environment name
- `--file=<path>` - Specific config file
- `--example` - Generate example config
- `--format=<json|yaml>` - Output format
- `--convert` - Convert between formats

**Exit Codes**:
- `0` - Config is valid
- `1` - Config is invalid

---

### 3. create-client.sh

**Purpose**: Create new client directory structure (called by generate.js)

**Usage**:
```bash
./bin/cli/create-client.sh <client-name> <description>
```

**Example**:
```bash
./bin/cli/create-client.sh myapp "My Application Tests"
```

**Creates**:
```
clients/myapp/
├── config/
│   ├── default.json
│   └── staging.json
├── data/
│   └── users.csv
├── lib/
│   ├── services/
│   └── factories/
├── scenarios/
│   └── example.ts
└── README.md
```

---

## Testing Tools

### 4. run-test.sh

**Purpose**: Run a single test with automatic config validation and result comparison

**Usage**:
```bash
./bin/testing/run-test.sh --client=<client> --test=<test> [options]
```

**Options**:
- `--client=<name>` - Client name (required)
- `--test=<file>` - Test file name (required)
- `--env=<name>` - Environment (default: default)
- `--profile=<name>` - Load profile (smoke, load, stress, spike)

**Examples**:
```bash
# Basic usage
./bin/testing/run-test.sh --client=examples --test=auth-flow.ts

# With environment
./bin/testing/run-test.sh --client=examples --env=staging --test=load-test.ts

# With load profile
./bin/testing/run-test.sh --client=examples --test=stress-test.ts --profile=stress
```

**Features**:
- ✅ Automatic config validation
- ✅ Automatic result comparison
- ✅ Report generation
- ✅ Log capture

**Output**:
```
reports/<client>/<test>/
├── k6-output-<timestamp>.json
├── k6-dashboard-<timestamp>.html
├── custom-report-<timestamp>.html
├── k6-execution-<timestamp>.log
├── k6-summary-<timestamp>.txt
└── comparison-<timestamp>.md
```

---

### 5. run-all-tests.sh

**Purpose**: Run all tests in a client directory with parallel execution

**Usage**:
```bash
./bin/testing/run-all-tests.sh --client=<client> [options]
```

**Options**:
- `--client=<name>` - Client name (required)
- `--env=<name>` - Environment (default: default)
- `--concurrency=<n>` - Parallel tests (default: 4)
- `--pattern=<glob>` - Test file pattern (default: *.ts)

**Examples**:
```bash
# Run all tests
./bin/testing/run-all-tests.sh --client=examples

# With custom concurrency
./bin/testing/run-all-tests.sh --client=examples --concurrency=2

# Filter by pattern
./bin/testing/run-all-tests.sh --client=examples --pattern="auth*.ts"

# Specific environment
./bin/testing/run-all-tests.sh --client=examples --env=staging
```

**Output**:
```
reports/<client>/
├── all-tests-<timestamp>/
│   ├── summary.md
│   └── execution.log
├── test-1/
│   └── ... (individual reports)
├── test-2/
│   └── ... (individual reports)
└── ...
```

---

### 6. run-parallel.js

**Purpose**: Run multiple tests in parallel with pattern matching

**Usage**:
```bash
node bin/testing/run-parallel.js --client=<client> --tests=<pattern> [options]
```

**Options**:
- `--client=<name>` - Client name
- `--tests=<pattern>` - Glob pattern for test files
- `--concurrency=<n>` - Number of parallel tests
- `--env=<name>` - Environment

**Examples**:
```bash
# Run all tests
node bin/testing/run-parallel.js \
  --client=examples \
  --tests="clients/examples/scenarios/*.ts" \
  --concurrency=4

# Run specific group
node bin/testing/run-parallel.js \
  --client=examples \
  --tests="clients/examples/scenarios/benchmark-*.ts"
```

**Features**:
- Parallel execution
- Progress tracking
- Summary report
- Exit code based on results

---

### 7. auto-compare.js

**Purpose**: Automatically compare test results with previous executions

**Usage**:
```bash
node bin/testing/auto-compare.js --client=<client> --test=<test>
```

**Environment Variables**:
- `MAX_HISTORY=<n>` - Number of historical results to compare (default: 5)
- `COMPARE_WITH=<files>` - Specific result files to compare (comma-separated)

**Examples**:
```bash
# Compare with last 5 executions
node bin/testing/auto-compare.js --client=examples --test=auth-flow

# Compare with last 10
MAX_HISTORY=10 node bin/testing/auto-compare.js --client=examples --test=auth-flow

# Compare with specific baselines
COMPARE_WITH="k6-output-20251201.json,k6-output-20251130.json" \
  node bin/testing/auto-compare.js --client=examples --test=auth-flow
```

**Output**:
- Top 3 improvements
- Top 3 degradations
- Detailed comparison table
- Markdown report

---

### 8. compare-results.js

**Purpose**: Compare two specific test result files

**Usage**:
```bash
node bin/testing/compare-results.js --baseline=<file> --current=<file> [--threshold=<n>]
```

**Options**:
- `--baseline=<file>` - Baseline result file
- `--current=<file>` - Current result file
- `--threshold=<n>` - Allowed degradation % (default: 10)

**Example**:
```bash
node bin/testing/compare-results.js \
  --baseline=reports/examples/auth-flow/k6-output-20251130.json \
  --current=reports/examples/auth-flow/k6-output-20251201.json \
  --threshold=5
```

**Exit Codes**:
- `0` - No regression
- `1` - Regression detected

---

### 9. mock-server.js

**Purpose**: Start mock API server for testing

**Usage**:
```bash
node bin/testing/mock-server.js [--port=<n>]
```

**Options**:
- `--port=<n>` - Server port (default: 3000)

**Example**:
```bash
# Start on default port
node bin/testing/mock-server.js

# Start on custom port
node bin/testing/mock-server.js --port=8080
```

**Endpoints**:
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

---

## Reporting Tools

### 10. report.js

**Purpose**: Generate enterprise HTML report from k6 JSON output

**Usage**:
```bash
node bin/reporting/report.js --input=<file> --output=<file>
```

**Example**:
```bash
node bin/reporting/report.js \
  --input=reports/examples/auth-flow/k6-output-latest.json \
  --output=reports/examples/auth-flow/custom-report.html
```

---

### 11. notify.js

**Purpose**: Send test result notifications to Slack, email, or webhooks

**Usage**:
```bash
node bin/reporting/notify.js --type=<type> --result=<file> [options]
```

**Options**:
- `--type=<slack|email|webhook>` - Notification type
- `--result=<file>` - Test result JSON file
- `--webhook=<url>` - Webhook URL (for slack/webhook)
- `--email=<address>` - Email address (for email)

**Examples**:
```bash
# Slack notification
node bin/reporting/notify.js \
  --type=slack \
  --result=reports/examples/auth-flow/k6-output-latest.json \
  --webhook=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email notification
node bin/reporting/notify.js \
  --type=email \
  --result=reports/examples/auth-flow/k6-output-latest.json \
  --email=team@example.com
```

---

### 12. trend-analysis.js

**Purpose**: Analyze performance trends over multiple test executions

**Usage**:
```bash
node bin/reporting/trend-analysis.js --client=<client> --test=<test> [--limit=<n>]
```

**Options**:
- `--client=<name>` - Client name
- `--test=<name>` - Test name
- `--limit=<n>` - Number of results to analyze (default: 30)

**Example**:
```bash
node bin/reporting/trend-analysis.js \
  --client=examples \
  --test=auth-flow \
  --limit=30
```

**Output**:
- Trend charts
- Statistical analysis
- Regression detection
- Markdown report

---

### 13. test-summary.sh

**Purpose**: Generate beautiful test summary from reports

**Usage**:
```bash
./bin/reporting/test-summary.sh <reports-dir> <client> <test>
```

**Example**:
```bash
./bin/reporting/test-summary.sh reports examples auth-flow
```

**Output**:
- Formatted summary
- Key metrics
- Pass/fail status
- Threshold results

---

## Version Management

### 14. version.sh

**Purpose**: Manage framework version (semantic versioning)

**Usage**:
```bash
./bin/version.sh [major|minor|patch]
```

**Examples**:
```bash
# Bump patch version (1.0.0 -> 1.0.1)
./bin/version.sh patch

# Bump minor version (1.0.0 -> 1.1.0)
./bin/version.sh minor

# Bump major version (1.0.0 -> 2.0.0)
./bin/version.sh major

# Auto-detect from commits
npm run version:bump
```

---

## Quick Reference

### Most Common Commands

```bash
# 1. Create new client
npm run generate

# 2. Validate config
node bin/cli/validate-config.js --client=myapp --env=default

# 3. Run single test
./bin/testing/run-test.sh --client=myapp --test=my-test.ts

# 4. Run all tests
./bin/testing/run-all-tests.sh --client=myapp

# 5. Compare results
node bin/testing/auto-compare.js --client=myapp --test=my-test

# 6. Send notification
node bin/reporting/notify.js --type=slack --result=report.json --webhook=URL
```

---

## Environment Variables

Global environment variables that affect tool behavior:

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_HISTORY` | Historical results to compare | 5 |
| `COMPARE_WITH` | Specific baselines to compare | - |
| `K6_DEBUG` | Enable debug logging | false |
| `K6_SUMMARY_MODE` | Summary detail level | full |
| `K6_PROFILE` | Load profile | - |

---

## Exit Codes

Standard exit codes used by all tools:

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Failure / Error |
| 99 | Threshold failure |
| 107 | Script error |

---

## Permissions

Ensure all scripts are executable:

```bash
chmod +x bin/**/*.sh
chmod +x bin/**/*.js
```

---

## CI/CD Integration

All tools are designed for CI/CD use:

```yaml
# GitHub Actions example
- name: Run Tests
  run: ./bin/testing/run-all-tests.sh --client=myapp

- name: Compare Results
  run: node bin/testing/auto-compare.js --client=myapp --test=load-test

- name: Send Notification
  if: failure()
  run: |
    node bin/reporting/notify.js \
      --type=slack \
      --result=reports/myapp/load-test/k6-output-latest.json \
      --webhook=${{ secrets.SLACK_WEBHOOK }}
```

---

## Related Documentation

- [Running Tests](./RUNNING_TESTS.md) - Test execution guide
- [Running Multiple Tests](./RUNNING_MULTIPLE_TESTS.md) - Batch execution
- [Auto Comparison](./AUTO_COMPARISON.md) - Result comparison
- [Config Validation](./CONFIG_VALIDATION.md) - Configuration guide
- [CI/CD Integration](./CI_CD_INTEGRATION.md) - Pipeline setup

---

## Summary

The framework provides **14 executable tools** organized into 4 categories:

✅ **CLI Utilities** (3) - Generate, validate, create  
✅ **Testing Tools** (6) - Run, compare, mock  
✅ **Reporting Tools** (4) - Report, notify, analyze, summarize  
✅ **Version Management** (1) - Semantic versioning  

All tools are:
- Well-documented
- CI/CD ready
- Exit code compliant
- Environment variable aware
- Error handling included
