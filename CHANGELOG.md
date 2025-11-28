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

## [1.1.0] - 2025-11-28

### Planned
- Additional client examples
- Performance monitoring dashboards
- NPM package publication
