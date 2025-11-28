# k6 Enterprise Load Testing Framework

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/yourusername/k6-enterprise-framework)
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
node dist/core/cli.js --client=local --test=example.ts
```

## 📚 Documentation

- **[README](docs/README.md)** - Complete framework documentation
- **[Test Types Guide](docs/TEST_TYPES.md)** - Unit, Flow, Browser, and Mixed tests
- **[Redis Integration Guide](docs/REDIS.md)** - Using Redis for data management
- **[Extensions & Instrumentation](docs/EXTENSIONS.md)** - Tracing (Tempo), Profiling (Pyroscope), and xk6 extensions
- **[Running Tests On-Demand](docs/RUNNING_TESTS.md)** - Execute tests via CI/CD pipelines
- **[Client Management](docs/CLIENT_MANAGEMENT.md)** - Manage client code in separate repositories
- **[Contributing Guide](docs/CONTRIBUTING.md)** - How to contribute to the project
- **[Commit Guidelines](docs/COMMIT_GUIDELINES.md)** - Conventional commits and versioning
- **[Security Policy](SECURITY.md)** - Security guidelines and reporting
- **[Tasks & Roadmap](docs/TASKS.md)** - Project tasks and future plans

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
- ✅ **Rich Helper Library** - Date, Request, Data, and Validation helpers
- ✅ **Redis Integration** - Share data between VUs, cache setup data
- ✅ **CI/CD Ready** - GitHub Actions & GitLab CI support
- ✅ **TypeScript** - Full ES module support

## 📊 Reports

The framework generates three types of reports for each test run:

```
reports/{client}/{test}/
├── k6-output-{timestamp}.json          # Raw k6 metrics
├── k6-dashboard-{timestamp}.html       # k6 web dashboard (interactive)
└── custom-report-{timestamp}.html      # Custom enterprise report
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
