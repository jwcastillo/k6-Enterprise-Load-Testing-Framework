# latam - Load Testing Client

This directory contains load testing scenarios and configuration for the latam client.

## Structure

```
latam/
├── config/          # Environment configurations
│   ├── default.json # Default configuration
│   ├── staging.json # Staging environment
│   └── prod.json    # Production environment
├── data/            # Test data (CSV, JSON)
│   ├── users.csv    # Sample users
│   └── products.json # Sample products
├── lib/             # Service objects and utilities
│   └── services/    # API service abstractions
│       └── ExampleService.ts
├── scenarios/       # Test scenarios
│   └── example.ts   # Example test
└── README.md        # This file
```

## Running Tests

### Local Execution
```bash
# Run with default config
node dist/core/cli.js --client=latam --test=example.ts

# Run with specific environment
node dist/core/cli.js --client=latam --env=staging --test=example.ts

# Run with load profile
node dist/core/cli.js --client=latam --test=example.ts --profile=load
```

### Docker Execution
```bash
CLIENT=latam TEST=example.ts docker-compose up
```

## Configuration

Edit the configuration files in `config/` to customize:
- Base URL
- Scenarios (VUs, duration, executors)
- Thresholds (performance criteria)

## Adding New Tests

1. Create a new test file in `scenarios/`
2. Import necessary services from `lib/services/`
3. Define test logic using k6 API
4. Run the test using the CLI

## Data Files

- `data/users.csv` - Sample user data
- `data/products.json` - Sample product data

You can load this data in your tests using k6's `SharedArray` or the framework's data helpers.

## Services

Services are located in `lib/services/` and provide reusable API abstractions:

- `ExampleService.ts` - Example API service

Create new services by extending `BaseService` from `shared/base-service.js`.

## Next Steps

1. Update `config/` files with your actual API URLs
2. Add your service objects in `lib/services/`
3. Create test scenarios in `scenarios/`
4. Add test data in `data/`
5. Run tests locally or via CI/CD

For more information, see the [main documentation](../../docs/README.md).
