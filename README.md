# k6 Enterprise Load Testing Framework

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/yourusername/k6-enterprise-framework)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/yourusername/k6-enterprise-framework/actions)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/yourusername/k6-enterprise-framework)

Enterprise-grade, modular load testing framework built on k6 with multi-client support, Redis integration, and comprehensive test type coverage.

## 🚀 Features

- ✅ **Multi-Client Architecture** - Complete isolation per client
- ✅ **Service Object Model** - Reusable API abstractions (like Page Object Model)
- ✅ **4 Test Types** - Unit, Flow, Browser, and Mixed tests
- ✅ **Config-Driven Tests** - Define tests in JSON without writing code
- ✅ **Rich Helper Library** - Date, Request, Data, and Validation helpers
- ✅ **HTML Reporting** - Beautiful, detailed test reports with metrics
- ✅ **Redis Integration** - Share data between VUs, cache setup data
- ✅ **Advanced k6 Config** - Multiple scenarios, thresholds, executors
- ✅ **Docker Support** - Containerized execution with docker-compose
- ✅ **TypeScript** - Full ES module support
- ✅ **Environment Management** - Hierarchical configuration (Core → Client → Env)

## 📦 Installation

```bash
npm install
npm run build
```

## 🎯 Quick Start

```bash
# Run a simple test
node dist/core/cli.js --client=client-a --env=default --test=example.ts

# Run with Docker
docker-compose up
```

## 📚 Documentation

- [README.md](README.md) - Main documentation
- [TEST_TYPES.md](TEST_TYPES.md) - Test types guide (Spanish)
- [REDIS.md](REDIS.md) - Redis integration guide (Spanish)

## 🏗️ Project Structure

```
/
├── core/                 # Framework engine
├── shared/              # Common utilities
├── clients/             # Client implementations
│   └── client-a/
│       ├── config/      # Environment configs
│       ├── data/        # Test data (CSV, JSON)
│       ├── lib/         # Service objects
│       └── scenarios/   # Test scenarios
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 📖 Usage Examples

### Unit Test (API Endpoint)
```bash
node dist/core/cli.js --client=client-a --test=example.ts
```

### Flow Test (Multi-Step)
```bash
node dist/core/cli.js --client=client-a --test=auth-flow.ts
```

### Browser Test
```bash
K6_BROWSER_ENABLED=true node dist/core/cli.js --client=client-a --test=browser-test.ts
```

### Redis Data Loading
```bash
node dist/core/cli.js --client=client-a --test=redis-data-loader.ts
```

### Config-Driven Tests
Run tests defined purely in `default.json` or environment config:
```bash
node dist/core/cli.js --client=client-a --test=config-driven.ts
```

### Ejecución Remota / Gateway (Desde otro Repo)
Puedes ejecutar tests pasando un archivo de configuración completo (scenarios + test cases) desde otro repositorio o pipeline:

```bash
node dist/core/cli.js --client=local --test=config-driven.ts --config=./path/to/custom-config.json
```

El framework actuará como un Quality Gateway, retornando exit code 1 si los thresholds fallan.


## 🔧 Configuration

Configuration is loaded hierarchically:
1. Core defaults
2. Client defaults (`clients/<client>/config/default.json`)
3. Environment-specific (`clients/<client>/config/<env>.json`)
4. CLI flags and environment variables

## 🐳 Docker

```bash
# Build
npm run docker:build

# Run with environment variables
CLIENT=client-a ENV=staging TEST=example.ts docker-compose up
```

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please follow conventional commits.

## 📊 Version History

See [CHANGELOG.md](CHANGELOG.md) for version history.
