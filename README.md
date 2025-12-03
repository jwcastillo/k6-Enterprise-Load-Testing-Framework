# k6 Enterprise Load Testing Framework

[![Version](https://img.shields.io/badge/version-1.10.0-blue.svg)](https://github.com/yourusername/k6-enterprise-framework)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/yourusername/k6-enterprise-framework/actions)

Enterprise-grade, modular load testing framework built on k6 with multi-client support, Redis integration, comprehensive test type coverage, and advanced reporting.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run a test
node dist/core/cli.js --client=examples --test=example.ts
```

## 📚 Documentation

### Core Documentation
- **[Framework Summary](docs/FRAMEWORK_SUMMARY.md)** - Complete feature overview
- **[Examples Guide](docs/EXAMPLES.md)** - All 15 example scenarios
- **[Configuration Validation](docs/CONFIG_VALIDATION.md)** - Config validation with JSON Schema

### Architecture & Patterns
- **[Architecture](docs/ARCHITECTURE.md)** - Test Automation Solution architecture
- **[Service Object Model](docs/SERVICE_OBJECT_MODEL.md)** - SOM pattern guide
- **[Compliance](docs/COMPLIANCE.md)** - 100% compliance verification

### Integration & Operations
- **[CI/CD Integration](docs/CI_CD_INTEGRATION.md)** - GitHub Actions & GitLab CI
- **[Client Management](docs/CLIENT_MANAGEMENT.md)** - Multi-client architecture
- **[Observability](docs/OBSERVABILITY.md)** - Tempo, Pyroscope, Grafana

### Development
- **[Contributing Guide](docs/CONTRIBUTING.md)** - How to contribute
- **[Commit Guidelines](docs/COMMIT_GUIDELINES.md)** - Conventional commits
- **[Security Policy](SECURITY.md)** - Security guidelines


## 👨‍💻 Development Workflow

### Making Commits
Use Commitizen for interactive, standardized commits:
```bash
git add .
npm run commit
```

### Versioning
Automated semantic versioning based on conventional commits:
```bash
# Automatic version bump (analyzes commits)
npm run version:bump

# Manual version bump
./bin/version.sh [major|minor|patch]
```

### Security
```bash
# Run security audit
npm run security:audit

# Fix vulnerabilities
npm run security:fix
```

## ✨ Key Features

- ✅ **k6 Web Dashboard** - Interactive HTML reports with charts
- ✅ **Metrics Backends** - Export to Prometheus, Datadog, New Relic, Dynatrace, InfluxDB
- ✅ **Multi-Client Architecture** - Complete isolation per client
- ✅ **Config-Driven Tests** - Define tests in JSON without writing code
- ✅ **4 Test Types** - Unit, Flow, Browser, and Mixed tests
- ✅ **Rich Helper Library** - Date, Request, Data, Validation, Header, and Structured Logger helpers
- ✅ **Header Management** - Standardized HTTP headers (X-Correlation-ID, X-Trace-ID, etc.)
- ✅ **Weighted Switch** - Probabilistic execution for realistic scenarios
- ✅ **Structured Logging** - JSON-formatted logs for external ingestion
- ✅ **Redis Integration** - Share data between VUs, cache setup data
- ✅ **CI/CD Ready** - GitHub Actions & GitLab CI support
- ✅ **TypeScript** - Full ES module support

## 📊 Reports

The framework generates multiple reports and artifacts for each test run:

```
reports/{client}/{test}/
├── k6-output-{timestamp}.json          # Raw k6 metrics (NDJSON format)
├── k6-summary-{timestamp}.json         # Summary metrics for comparison
├── k6-dashboard-{timestamp}.html       # k6 web dashboard (interactive charts)
├── enterprise-report-{timestamp}.html  # Custom enterprise HTML report
├── k6-execution-{timestamp}.log        # Full execution log
├── k6-summary-{timestamp}.txt          # Text summary of results
└── comparison-{timestamp}.md           # Performance comparison (if previous runs exist)
```

## 🔧 Configuration

```json
{
  "baseUrl": "https://api.example.com",
  "k6Options": {
    "summaryMode": "full",
    "summaryTimeUnit": "ms",
    "metricsBackends": [
      {"type": "prometheus"}
    ]
  }
}
```

## 📖 Learn More

Visit the [docs](docs/) folder for comprehensive guides on:
- Test execution and configuration
- CI/CD pipeline integration
- Metrics backends setup
- Helper utilities usage
- And much more!

## 📝 License

ISC
