# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-26

### Added
- **Core Framework**
  - CLI runner with client/environment/test selection
  - Configuration loader with hierarchical merging
  - Base service class for Service Object Model pattern
  - TypeScript support with ES modules

- **Multi-Client Architecture**
  - Strict client isolation (config, data, lib, scenarios)
  - Client-specific directory structure
  - Independent test execution per client

- **Test Types**
  - Unit tests for individual API endpoints
  - Flow tests for multi-step scenarios
  - Browser tests using k6 browser module
  - Mixed tests combining API and Browser

- **Service Objects**
  - BaseService class
  - ExampleService for API testing
  - AuthService for authentication flows

- **Redis Integration**
  - RedisHelper utility with full CRUD operations
  - Hash, List, and Counter support
  - CSV and JSON data loading examples
  - Setup/Load/Teardown pattern examples

- **Docker Support**
  - Dockerfile for containerized execution
  - docker-compose.yml with Redis service
  - Health checks and service dependencies
  - Environment variable configuration

- **Configuration**
  - Multiple environment support (default, staging, prod)
  - JSON-based configuration files
  - Environment variable overrides
  - Advanced k6 scenarios and thresholds

- **Documentation**
  - Comprehensive README
  - Test types guide (TEST_TYPES.md)
  - Redis integration guide (REDIS.md)
  - Example scenarios and data files

- **Example Client (client-a)**
  - Sample configurations for 3 environments
  - CSV data (users.csv)
  - JSON data (products.json)
  - 6 example scenarios:
    - example.ts (unit test)
    - auth-flow.ts (flow test)
    - browser-test.ts (browser test)
    - mixed-test.ts (API + browser)
    - redis-test.ts (Redis basics)
    - redis-data-loader.ts (CSV/JSON loading)

### Infrastructure
- Git repository initialization
- .gitignore for node_modules, dist, screenshots
- .dockerignore for optimized builds
- .env.example for environment variables
- TypeScript configuration with path aliases

## [Unreleased]

### Planned
- CI/CD pipeline templates
- Additional client examples
- Performance monitoring integration
- HTML report generation
- NPM package publication
