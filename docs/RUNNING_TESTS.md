# Running Tests On-Demand via CI/CD Pipelines

This guide explains how to execute k6 load tests on-demand using GitHub Actions and GitLab CI pipelines.

## Overview

The framework provides two separate pipelines:
1. **Validation Pipeline** (`ci.yml`) - Runs automatically on push/PR to validate code quality
2. **Test Execution Pipeline** (`run-tests.yml`) - Runs manually on-demand to execute specific k6 tests

## GitHub Actions - On-Demand Test Execution

### Method 1: Manual Execution from GitHub UI

1. Navigate to your repository on GitHub
2. Click on the **Actions** tab
3. In the left sidebar, select **"Run k6 Tests"** workflow
4. Click the **"Run workflow"** button (top right)
5. Fill in the parameters:
   - **client**: The client to test (e.g., `local`, `client-a`)
   - **env**: Environment (e.g., `default`, `staging`, `prod`)
   - **test**: Test file name (e.g., `example.ts`, `auth-flow.ts`)
   - **profile**: Load profile (e.g., `smoke`, `load`, `stress`, `spike`)
6. Click **"Run workflow"** to start execution

### Method 2: Execution via GitHub API

```bash
# Generate a Personal Access Token:
# GitHub → Settings → Developer settings → Personal access tokens → Generate new token
# Required scopes: repo, workflow

# Execute workflow
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/OWNER/REPO/actions/workflows/run-tests.yml/dispatches \
  -d '{
    "ref": "main",
    "inputs": {
      "client": "local",
      "env": "staging",
      "test": "load-test.ts",
      "profile": "load"
    }
  }'
```

### Method 3: Trigger from Another Workflow

```yaml
name: Trigger Load Tests

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  trigger-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger k6 Tests
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            await github.rest.actions.createWorkflowDispatch({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'run-tests.yml',
              ref: 'main',
              inputs: {
                client: 'production',
                env: 'prod',
                test: 'smoke-suite.ts',
                profile: 'smoke'
              }
            })
```

### Method 4: Scheduled Execution

Create a new workflow file `.github/workflows/scheduled-tests.yml`:

```yaml
name: Scheduled Load Tests

on:
  schedule:
    # Run daily at 6 AM UTC
    - cron: '0 6 * * *'
  workflow_dispatch:

jobs:
  daily-smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Setup k6
        uses: grafana/setup-k6-action@v1
      
      - name: Run Daily Smoke Tests
        run: |
          node dist/core/cli.js \
            --client=production \
            --env=prod \
            --test=smoke-suite.ts \
            --profile=smoke
      
      - name: Upload Reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: daily-smoke-reports
          path: reports/**/*
          retention-days: 30
```

## GitLab CI - On-Demand Test Execution

### Method 1: Manual Execution from GitLab UI

1. Navigate to your project on GitLab
2. Go to **CI/CD → Pipelines**
3. Click **"Run pipeline"** button (top right)
4. Select the branch (e.g., `main`)
5. Click on the **"run:test"** job
6. Click the **"Play"** button (▶️) to execute
7. (Optional) Add custom variables before running:
   - `CLIENT`: Client name (default: `local`)
   - `TEST`: Test file (default: `example.ts`)
   - `ENV`: Environment (default: `default`)

### Method 2: Execution via GitLab API

```bash
# Generate a Personal Access Token:
# GitLab → Settings → Access Tokens → Add new token
# Required scopes: api, read_api, write_repository

# Trigger pipeline with specific job
curl -X POST \
  -H "PRIVATE-TOKEN: YOUR_GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/PROJECT_ID/pipeline" \
  -d "ref=main" \
  -d "variables[CLIENT]=production" \
  -d "variables[TEST]=load-test.ts" \
  -d "variables[ENV]=prod"
```

### Method 3: Trigger from Another Pipeline

```yaml
# In your .gitlab-ci.yml or another project
trigger_load_tests:
  stage: test
  script:
    - |
      curl -X POST \
        -H "PRIVATE-TOKEN: $CI_JOB_TOKEN" \
        "$CI_API_V4_URL/projects/FRAMEWORK_PROJECT_ID/pipeline" \
        -d "ref=main" \
        -d "variables[CLIENT]=production" \
        -d "variables[TEST]=critical-flow.ts" \
        -d "variables[ENV]=staging"
  only:
    - main
```

### Method 4: Scheduled Execution

Add to your `.gitlab-ci.yml`:

```yaml
scheduled:smoke:
  extends: .test_template
  needs: [build]
  variables:
    CLIENT: "production"
    TEST: "smoke-suite.ts"
    ENV: "prod"
  only:
    - schedules
```

Then create a schedule in GitLab:
1. Go to **CI/CD → Schedules**
2. Click **"New schedule"**
3. Set description: "Daily Smoke Tests"
4. Set interval pattern: `0 6 * * *` (6 AM daily)
5. Set target branch: `main`
6. Save schedule

## Available Parameters

| Parameter | Description | Example Values | Default | Required |
|-----------|-------------|----------------|---------|----------|
| `client` | Client to test | `local`, `client-a`, `production` | `local` | ✅ Yes |
| `env` | Environment | `default`, `staging`, `prod` | `default` | ✅ Yes |
| `test` | Test file | `example.ts`, `auth-flow.ts` | `example.ts` | ✅ Yes |
| `profile` | Load profile | `smoke`, `load`, `stress`, `spike` | `smoke` | ❌ No |

## Test Profiles

### Smoke Profile
- **Purpose**: Quick validation
- **VUs**: 1-5
- **Duration**: 30s - 1m
- **Use case**: Pre-deployment checks, daily health checks

### Load Profile
- **Purpose**: Sustained load testing
- **VUs**: 10-50
- **Duration**: 5m - 30m
- **Use case**: Performance baseline, capacity planning

### Stress Profile
- **Purpose**: Find breaking point
- **VUs**: Ramps up to 100+
- **Duration**: 10m - 1h
- **Use case**: Identify system limits, stress testing

### Spike Profile
- **Purpose**: Sudden traffic spike
- **VUs**: Rapid ramp from 0 to high
- **Duration**: 5m - 15m
- **Use case**: Black Friday scenarios, viral events

## Viewing Results

### GitHub Actions
1. Go to **Actions** tab
2. Click on the workflow run
3. Download artifacts from the **Artifacts** section
4. Reports include:
   - JSON output (`k6-output-*.json`)
   - Enterprise HTML report (`enterprise-report-*.html`)
   - k6 Dashboard (`k6-dashboard-*.html`)
   - Execution log (`k6-log-*.log`)
   - Summary (`k6-summary-*.txt`)
   - Screenshots (if browser tests)

### GitLab CI
1. Go to **CI/CD → Pipelines**
2. Click on the pipeline run
3. Click on the **"run:test"** job
4. View logs in the job output
5. Download artifacts from the right sidebar
6. Reports are organized in `reports/{client}/{test}/` structure

## Best Practices

### 1. Use Descriptive Test Names
```bash
# Good
--test=user-registration-flow.ts
--test=api-load-baseline.ts

# Avoid
--test=test1.ts
--test=mytest.ts
```

### 2. Choose Appropriate Profiles
- **Smoke**: For quick validation (< 1 minute)
- **Load**: For realistic traffic simulation (5-30 minutes)
- **Stress**: For finding limits (10-60 minutes)
- **Spike**: For sudden traffic scenarios (5-15 minutes)

### 3. Set Up Notifications
Configure Slack/Discord/Email notifications for:
- Test failures
- Threshold violations
- Long-running tests

### 4. Archive Important Results
- Keep smoke test results for 7 days
- Keep load test results for 30 days
- Keep stress test results for 90 days

### 5. Use Environment Variables for Secrets
Never hardcode:
- API tokens
- Passwords
- API keys

Use GitHub Secrets or GitLab CI/CD Variables instead.

## Troubleshooting

### Test Not Starting
- **GitHub**: Check workflow file syntax
- **GitLab**: Verify job is not blocked by dependencies
- **Both**: Ensure branch exists and has latest code

### Test Failing
1. Check test logs in job output
2. Verify environment variables are set
3. Check if test file exists in `clients/{client}/scenarios/`
4. Validate k6 is installed correctly

### No Artifacts Generated
- **GitHub**: Check `upload-artifact` step completed
- **GitLab**: Verify `artifacts.paths` configuration
- **Both**: Ensure reports directory was created

### Permission Errors
- **GitHub**: Verify token has `workflow` scope
- **GitLab**: Check token has `api` and `write_repository` scopes
- **Both**: Ensure user has appropriate project permissions

## Examples

### Quick Smoke Test
```bash
# GitHub
curl -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/actions/workflows/run-tests.yml/dispatches \
  -d '{"ref": "main", "inputs": {"client": "local", "test": "example.ts", "profile": "smoke"}}'

# GitLab
curl -X POST \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/PROJECT_ID/pipeline" \
  -d "ref=main" \
  -d "variables[CLIENT]=local" \
  -d "variables[TEST]=example.ts"
```

### Full Load Test
```bash
# GitHub
curl -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/actions/workflows/run-tests.yml/dispatches \
  -d '{"ref": "main", "inputs": {"client": "production", "env": "staging", "test": "full-load.ts", "profile": "load"}}'
```

### Stress Test
```bash
# GitLab
curl -X POST \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/PROJECT_ID/pipeline" \
  -d "ref=main" \
  -d "variables[CLIENT]=production" \
  -d "variables[ENV]=staging" \
  -d "variables[TEST]=stress-test.ts" \
  -d "variables[PROFILE]=stress"
```

## Integration with Other Tools

### Slack Notifications
Add to your workflow:

```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "k6 Test Results: ${{ job.status }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Test*: ${{ github.event.inputs.test }}\n*Status*: ${{ job.status }}"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Datadog Integration
k6 can send metrics directly to Datadog:

```bash
K6_DATADOG_ENABLED=true \
K6_DATADOG_API_KEY=$DATADOG_API_KEY \
node dist/core/cli.js --client=production --test=load-test.ts
```

## Next Steps

- [Test Types Guide](TEST_TYPES.md) - Learn about different test types
- [Extensions Guide](EXTENSIONS.md) - Enable tracing and profiling
- [Contributing Guide](../CONTRIBUTING.md) - How to add new tests
