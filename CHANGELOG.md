# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.0] - 2025-11-30

### Added
- **API Contract Testing**: `ContractValidator` helper for JSON Schema and OpenAPI validation
- **GraphQL Testing**: `GraphQLHelper` for queries, mutations, and schema introspection
- **WebSocket Testing**: Example scenario for WebSocket connections and messaging
- **File Upload/Download**: Scenario for multipart form-data uploads and file downloads
- **Rate Limiting**: Scenario with adaptive backoff and rate limit detection
- Example contract schema: `clients/examples/contracts/user-api.schema.json`

### Changed
- Updated `docs/TASKS.md` to mark Advanced Testing as completed

## [1.7.0] - 2025-11-29

### Added
- **Custom Grafana Dashboard**: `observability/grafana/k6-dashboard.json` with 5 panels
- **Prometheus AlertManager Rules**: 5 alert rules for performance monitoring
- **Grafana-native Alerts**: Alert rules for Grafana 8+
- **Notification System**: `bin/notify.js` for Slack, Discord, and Email notifications
- **Trend Analysis**: `bin/trend-analysis.js` for historical test comparison
- Documentation: `observability/grafana/README.md`, `observability/alerts/README.md`

### Changed
- Added `notify` and `trend-analysis` scripts to `package.json`
- Updated `docs/TASKS.md` to mark Observability as completed

## [1.6.0] - 2025-11-29

### Added
- **Docker Publishing**: CI/CD job to publish images to GHCR on tag push
- **Helm Chart**: `charts/k6-enterprise/` for Kubernetes deployment
- **Distributed Testing**: k6-operator integration and documentation
- Documentation: `docs/DISTRIBUTED_TESTING.md`
- Example CRD: `k6-operator/example-crd.yaml`

### Changed
- Fixed syntax error in `.github/workflows/ci.yml`
- Updated `docs/TASKS.md` to mark Production Features as completed

## [1.5.0] - 2025-11-28

### Added
- **Chaos Testing**: `ChaosHelper` for fault injection (latency, errors)
- **Performance Benchmarks**: `clients/benchmark/` with baseline and heavy-load scenarios
- **Service Oriented Model**: `BaseService` base class for all services
- **E-commerce Example**: `EcommerceService` and `ecommerce-flow.ts` scenario
- **Auth Example**: `AuthService` and `auth-flow.ts` scenario
- Documentation: `docs/BENCHMARKS.md`

### Changed
- Integrated `ChaosHelper` into `RequestHelper`
- Updated example scenarios to use Service Oriented Model

### Fixed
- Import paths in `AuthService` and `EcommerceService`
- Missing body parameter in `AuthService.logout()` method

## [1.4.0] - 2025-11-28

### Added
- **Test Generator CLI**: `bin/generate.js` with interactive mode
- **Code Templates**: Scenario, Service, and Factory templates
- **Enhanced Debug Mode**: `DebugHelper` with cURL generation
- **Better Error Messages**: Global error handling in `core/runner.ts`

### Changed
- Added `generate` script to `package.json`
- Updated `RequestHelper` to use `DebugHelper`

### Dependencies
- Added `inquirer@9.2.12` for interactive prompts
- Added `chalk@5.3.0` for terminal styling

## [1.3.0] - 2025-11-27

### Added
- **Mock Server**: `bin/mock-server.js` for testing with static/dynamic mocks
- **Data Factories**: `BaseFactory` and `UserFactory` for test data generation
- **Parallel Execution**: `bin/run-parallel.js` for concurrent test runs
- **Result Comparison**: `bin/compare-results.js` for regression detection

### Changed
- Added `mock`, `test:parallel` scripts to `package.json`

## [1.2.0] - 2025-11-27

### Added
- **Documentation Translation**: Complete English translation of all documentation (~1,457 lines)
- **Automated Versioning**: `bin/version.sh` script with Conventional Commits support
- **Commit Standards**: Commitizen, Commitlint, and Husky integration
- **Client Management**: `bin/create-client.sh` for generating new client structures
- **CI/CD Separation**: Separate workflows for validation and test execution
- **Security**: Dependency scanning with Dependabot and Renovate
- Documentation: `docs/RUNNING_TESTS.md`, `docs/CLIENT_MANAGEMENT.md`, `docs/COMMIT_GUIDELINES.md`, `SECURITY.md`

### Changed
- Renamed `commitlint.config.js` to `commitlint.config.cjs` for Node.js compatibility
- Split CI/CD into validation and execution pipelines

### Dependencies
- Added `commitizen`, `cz-conventional-changelog`
- Added `@commitlint/cli`, `@commitlint/config-conventional`
- Added `husky`, `lint-staged`

## [1.1.0] - 2025-11-28

### Planned
- Additional client examples
- Performance monitoring dashboards
- NPM package publication

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

## [1.1.0] - 2025-11-27

### Added
- **Common Helper Utilities** (32 new methods, 441 lines of code)
  - **DataHelper** (328 lines)
    - `randomBoolean()` - Random true/false value
    - `randomPrice(min, max)` - Random price with decimals
    - `randomName()` - Person name object (first, last, full)
    - `randomCompany()` - Company name generator
    - `randomAddress()` - Full address object (street, city, state, zip, country)
    - `randomProduct()` - E-commerce product with id, name, price, category
    - `randomCreditCard()` - Valid test card using Luhn algorithm
    - `randomDate(start, end)` - Random date in range
    - `randomUser()` - Complete user object with all fields
  
  - **DateHelper** (338 lines, 40+ methods verified)
    - Date formatting (ISO, custom formats)
    - Date arithmetic (add/subtract days, hours, minutes)
    - Date comparisons (before, after, past, future, today)
    - Timestamp utilities (Unix, milliseconds)
    - Random date generation
  
  - **RequestHelper** (243 lines)
    - Instance-based HTTP client (existing)
    - Static utility methods (10 new):
      - `buildAuthHeaders(token, type)` - Build authentication headers
      - `parseJsonResponse(response)` - Safe JSON parsing
      - `extractValue(response, path)` - Extract nested JSON values
      - `isSuccess(response)` - Check 2xx status
      - `hasStatus(response, code)` - Check specific status
      - `buildQueryString(params)` - Build URL query string
      - `mergeHeaders(...headers)` - Merge multiple header objects
      - `getHeader(response, name)` - Get header (case-insensitive)
      - `isJson(response)` - Check JSON content type
      - `correlationId()` - Generate request tracking ID
      - `Headers` - Preset header constants (JSON, FORM, etc.)
  
  - **ValidationHelper** (299 lines)
    - HTTP response validators (existing)
    - Format validators (13 new):
      - `isValidPhone(phone)` - Phone number validation
      - `isValidCreditCard(number)` - Luhn algorithm validation
      - `isValidPostalCode(code, country)` - Multi-country postal codes
      - `isValidIPAddress(ip)` - IPv4/IPv6 validation
      - `isValidUUID(uuid)` - UUID format validation
      - `matchesPattern(value, regex)` - Regex pattern matching
      - `isLengthInRange(str, min, max)` - String length validation
      - `isPositive(num)`, `isNegative(num)`, `isInteger(num)` - Number validators
      - `isValidDate(date)` - Date validation
      - `isValidJson(str)` - JSON string validation

- **Load Testing Profiles**
  - `smoke.json` - Quick validation (1 VU, 30s)
  - `load.json` - Sustained load with ramping VUs
  - `stress.json` - Breaking point test
  - `spike.json` - Sudden traffic spike simulation

- **Redis Standalone Data Loader**
  - `scripts/load-redis-data.js` - Pre-load CSV/JSON data into Redis
  - `scripts/clean-redis-data.js` - Clean up Redis test data
  - `scripts/copy-assets.js` - Copy CSV/JSON files to dist during build
  - NPM scripts: `npm run redis:load`, `npm run redis:clean`
  - Fixes k6 async setup() limitation

- **Test Scenarios**
  - `test-helpers.ts` - Comprehensive test for all helpers (100% passing)
  - Redis diagnostic tests (simple, diagnostic, manual, debug, ultra-simple)

- **Project Management**
  - `TASKS.md` - Project task tracking in markdown format

### Fixed
- **RedisHelper.hgetall()** - Now correctly handles k6 Redis client object response
  - Previously checked for array, k6 returns object directly
  - Fixes 0% check rate issue in redis-data-loader tests
- **ValidationHelper.isValidUrl()** - Changed from URL constructor to regex
  - k6 doesn't support URL constructor
  - Now uses regex pattern for validation

### Changed
- **Refactored test scenarios** to use DataHelper
  - `auth-flow.ts` - Uses DataHelper for user generation
  - `mixed-test.ts` - Uses DataHelper for test data
  - `redis-test.ts` - Uses DataHelper integration
  - `redis-data-loader.ts` - Updated to use pre-loaded data approach

### Testing
- **100% test coverage** for all helpers
  - 34/34 checks passing in test-helpers.ts
  - DataHelper: 14/14 checks ✅
  - ValidationHelper: 10/10 checks ✅
  - DateHelper: 10/10 checks ✅

## [1.2.0] - 2025-11-28

### Added
- **Advanced Reporting & Dashboards**
  - k6 web dashboard integration (159KB interactive HTML)
  - Enterprise Report with custom HTML generation
  - Browser Screenshots gallery in reports
  - Execution logs capture (`.log` files)
  - Summary extraction (`.txt` files)
  - Report organization: `reports/{client}/{test}/` structure
  - Links between all report artifacts (Dashboard, Log, Summary)

- **CI/CD Integration**
  - GitHub Actions workflow with test execution
  - GitLab CI pipeline configuration
  - Beautiful console test summaries (`bin/test-summary.sh`)
  - Automatic artifact upload (reports + screenshots)
  - 30-day artifact retention
  - Fun status messages based on test results

- **Observability & Debugging**
  - `K6_DEBUG` mode for verbose request/response logging
  - Tempo Tracing integration (`K6_TEMPO_ENABLED`)
  - Pyroscope Profiling integration (`K6_PYROSCOPE_ENABLED`)
  - Automatic trace propagation via `RequestHelper`
  - Extensions documentation (`docs/EXTENSIONS.md`)

- **k6 Configuration Enhancements**
  - Summary mode configuration (default: 'full')
  - Custom trend stats (min, avg, med, max, p90, p95, p99, p99.9)
  - Time unit configuration (default: milliseconds)
  - Metrics backends support:
    - Prometheus (experimental-prometheus-rw)
    - Datadog
    - New Relic
    - Dynatrace
    - InfluxDB
  - Environment variable overrides for all k6 options

- **Browser Testing**
  - `K6_REPORT_DIR` environment injection
  - Automatic screenshot capture and display
  - Browser test example (`browser-screenshot-test.ts`)
  - Screenshot gallery in Enterprise Report

- **Bin Scripts**
  - `bin/test-summary.sh` - Formatted test result summaries
  - Enhanced `bin/report.js` with multiple output formats

- **Documentation**
  - `docs/EXTENSIONS.md` - Extensions and instrumentation guide
  - Updated `docs/README.md` with debugging section
  - Comprehensive CI/CD execution examples

### Changed
- Renamed "custom report" to "Enterprise Report"
- Modified runner to use `spawn` instead of `exec` for better shell escaping
- Updated `RequestHelper` to support instrumentation libraries
- Enhanced report structure with organized artifact links

### Fixed
- Shell escaping issues with k6 arguments containing parentheses
- Summary extraction to capture only relevant section (not full output)

## [1.8.0] - 2025-11-30

### Added
- **API Contract Testing**: `ContractValidator` helper for JSON Schema and OpenAPI validation
- **GraphQL Testing**: `GraphQLHelper` for queries, mutations, and schema introspection
- **WebSocket Testing**: Example scenario for WebSocket connections and messaging
- **File Upload/Download**: Scenario for multipart form-data uploads and file downloads
- **Rate Limiting**: Scenario with adaptive backoff and rate limit detection
- Example contract schema: `clients/examples/contracts/user-api.schema.json`

### Changed
- Updated `docs/TASKS.md` to mark Advanced Testing as completed

## [1.7.0] - 2025-11-29

### Added
- **Custom Grafana Dashboard**: `observability/grafana/k6-dashboard.json` with 5 panels
- **Prometheus AlertManager Rules**: 5 alert rules for performance monitoring
- **Grafana-native Alerts**: Alert rules for Grafana 8+
- **Notification System**: `bin/notify.js` for Slack, Discord, and Email notifications
- **Trend Analysis**: `bin/trend-analysis.js` for historical test comparison
- Documentation: `observability/grafana/README.md`, `observability/alerts/README.md`

### Changed
- Added `notify` and `trend-analysis` scripts to `package.json`
- Updated `docs/TASKS.md` to mark Observability as completed

## [1.6.0] - 2025-11-29

### Added
- **Docker Publishing**: CI/CD job to publish images to GHCR on tag push
- **Helm Chart**: `charts/k6-enterprise/` for Kubernetes deployment
- **Distributed Testing**: k6-operator integration and documentation
- Documentation: `docs/DISTRIBUTED_TESTING.md`
- Example CRD: `k6-operator/example-crd.yaml`

### Changed
- Fixed syntax error in `.github/workflows/ci.yml`
- Updated `docs/TASKS.md` to mark Production Features as completed

## [1.5.0] - 2025-11-28

### Added
- **Chaos Testing**: `ChaosHelper` for fault injection (latency, errors)
- **Performance Benchmarks**: `clients/benchmark/` with baseline and heavy-load scenarios
- **Service Oriented Model**: `BaseService` base class for all services
- **E-commerce Example**: `EcommerceService` and `ecommerce-flow.ts` scenario
- **Auth Example**: `AuthService` and `auth-flow.ts` scenario
- Documentation: `docs/BENCHMARKS.md`

### Changed
- Integrated `ChaosHelper` into `RequestHelper`
- Updated example scenarios to use Service Oriented Model

### Fixed
- Import paths in `AuthService` and `EcommerceService`
- Missing body parameter in `AuthService.logout()` method

## [1.4.0] - 2025-11-28

### Added
- **Test Generator CLI**: `bin/generate.js` with interactive mode
- **Code Templates**: Scenario, Service, and Factory templates
- **Enhanced Debug Mode**: `DebugHelper` with cURL generation
- **Better Error Messages**: Global error handling in `core/runner.ts`

### Changed
- Added `generate` script to `package.json`
- Updated `RequestHelper` to use `DebugHelper`

### Dependencies
- Added `inquirer@9.2.12` for interactive prompts
- Added `chalk@5.3.0` for terminal styling

## [1.3.0] - 2025-11-27

### Added
- **Mock Server**: `bin/mock-server.js` for testing with static/dynamic mocks
- **Data Factories**: `BaseFactory` and `UserFactory` for test data generation
- **Parallel Execution**: `bin/run-parallel.js` for concurrent test runs
- **Result Comparison**: `bin/compare-results.js` for regression detection

### Changed
- Added `mock`, `test:parallel` scripts to `package.json`

## [1.1.0] - 2025-11-28

### Planned
- Additional client examples
- Performance monitoring dashboards
- NPM package publication
