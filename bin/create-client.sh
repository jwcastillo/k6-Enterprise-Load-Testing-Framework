#!/bin/bash
set -e

# Script to create a new client structure
# Usage: ./bin/create-client.sh <client-name>

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if client name is provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: Client name is required${NC}"
  echo -e "${YELLOW}Usage: $0 <client-name>${NC}"
  echo -e "${YELLOW}Example: $0 my-company${NC}"
  exit 1
fi

CLIENT_NAME="$1"
CLIENT_DIR="clients/${CLIENT_NAME}"

# Validate client name (alphanumeric and hyphens only)
if ! [[ "$CLIENT_NAME" =~ ^[a-z0-9-]+$ ]]; then
  echo -e "${RED}❌ Error: Client name must contain only lowercase letters, numbers, and hyphens${NC}"
  exit 1
fi

# Check if client already exists
if [ -d "$CLIENT_DIR" ]; then
  echo -e "${RED}❌ Error: Client '${CLIENT_NAME}' already exists${NC}"
  exit 1
fi

echo -e "${BLUE}📦 Creating new client structure: ${CLIENT_NAME}${NC}"
echo ""

# Create directory structure
echo -e "${BLUE}📁 Creating directories...${NC}"
mkdir -p "${CLIENT_DIR}/config"
mkdir -p "${CLIENT_DIR}/data"
mkdir -p "${CLIENT_DIR}/lib/services"
mkdir -p "${CLIENT_DIR}/scenarios"

# Create config files
echo -e "${BLUE}📝 Creating configuration files...${NC}"

# default.json
cat > "${CLIENT_DIR}/config/default.json" << 'EOF'
{
  "baseUrl": "https://api.example.com",
  "scenarios": {
    "default": {
      "executor": "constant-vus",
      "vus": 10,
      "duration": "30s"
    }
  },
  "thresholds": {
    "http_req_duration": ["p(95)<500"],
    "http_req_failed": ["rate<0.01"],
    "checks": ["rate>0.95"]
  }
}
EOF

# staging.json
cat > "${CLIENT_DIR}/config/staging.json" << 'EOF'
{
  "baseUrl": "https://staging-api.example.com",
  "scenarios": {
    "default": {
      "executor": "ramping-vus",
      "startVUs": 0,
      "stages": [
        { "duration": "1m", "target": 10 },
        { "duration": "3m", "target": 10 },
        { "duration": "1m", "target": 0 }
      ]
    }
  },
  "thresholds": {
    "http_req_duration": ["p(95)<1000"],
    "http_req_failed": ["rate<0.05"],
    "checks": ["rate>0.90"]
  }
}
EOF

# prod.json
cat > "${CLIENT_DIR}/config/prod.json" << 'EOF'
{
  "baseUrl": "https://api.example.com",
  "scenarios": {
    "default": {
      "executor": "constant-vus",
      "vus": 5,
      "duration": "1m"
    }
  },
  "thresholds": {
    "http_req_duration": ["p(95)<300"],
    "http_req_failed": ["rate<0.01"],
    "checks": ["rate>0.99"]
  }
}
EOF

# Create sample data files
echo -e "${BLUE}📊 Creating sample data files...${NC}"

# users.csv
cat > "${CLIENT_DIR}/data/users.csv" << 'EOF'
username,email,password,role
john_doe,john@example.com,Pass123!,user
jane_smith,jane@example.com,Pass456!,admin
bob_jones,bob@example.com,Pass789!,user
EOF

# products.json
cat > "${CLIENT_DIR}/data/products.json" << 'EOF'
{
  "products": [
    {
      "id": "prod_001",
      "name": "Sample Product 1",
      "price": 29.99,
      "category": "electronics",
      "stock": 100
    },
    {
      "id": "prod_002",
      "name": "Sample Product 2",
      "price": 49.99,
      "category": "books",
      "stock": 50
    }
  ],
  "config": {
    "tax_rate": 0.08,
    "shipping_cost": 9.99
  }
}
EOF

# Create service example
echo -e "${BLUE}🔧 Creating service examples...${NC}"

cat > "${CLIENT_DIR}/lib/services/ExampleService.ts" << 'EOF'
import { BaseService } from '../../../shared/base-service.js';
import { RequestHelper } from '../../../shared/helpers/RequestHelper.js';

export class ExampleService extends BaseService {
  private requestHelper: RequestHelper;

  constructor(baseUrl: string) {
    super(baseUrl);
    this.requestHelper = new RequestHelper(baseUrl);
  }

  /**
   * Get example resource
   */
  getExample(id: string) {
    return this.requestHelper.get(`/api/examples/${id}`);
  }

  /**
   * Create example resource
   */
  createExample(data: any) {
    return this.requestHelper.post('/api/examples', data);
  }

  /**
   * Update example resource
   */
  updateExample(id: string, data: any) {
    return this.requestHelper.put(`/api/examples/${id}`, data);
  }

  /**
   * Delete example resource
   */
  deleteExample(id: string) {
    return this.requestHelper.del(`/api/examples/${id}`);
  }
}
EOF

# Create test scenarios
echo -e "${BLUE}🧪 Creating test scenarios...${NC}"

# example.ts
cat > "${CLIENT_DIR}/scenarios/example.ts" << 'EOF'
import { check } from 'k6';
import { ExampleService } from '../lib/services/ExampleService.js';
import { ValidationHelper } from '../../shared/helpers/ValidationHelper.js';

const config = JSON.parse(open('../config/default.json'));
const service = new ExampleService(config.baseUrl);

export const options = {
  scenarios: config.scenarios,
  thresholds: config.thresholds
};

export default function () {
  // Example GET request
  const res = service.getExample('1');

  check(res, {
    'status is 200': (r) => ValidationHelper.hasStatus(r, 200),
    'response time < 500ms': (r) => ValidationHelper.isResponseTimeLessThan(r, 500),
    'has valid structure': (r) => ValidationHelper.hasJsonStructure(r, ['id', 'name'])
  });
}
EOF

# README.md
cat > "${CLIENT_DIR}/README.md" << EOF
# ${CLIENT_NAME} - Load Testing Client

This directory contains load testing scenarios and configuration for the ${CLIENT_NAME} client.

## Structure

\`\`\`
${CLIENT_NAME}/
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
\`\`\`

## Running Tests

### Local Execution
\`\`\`bash
# Run with default config
node dist/core/cli.js --client=${CLIENT_NAME} --test=example.ts

# Run with specific environment
node dist/core/cli.js --client=${CLIENT_NAME} --env=staging --test=example.ts

# Run with load profile
node dist/core/cli.js --client=${CLIENT_NAME} --test=example.ts --profile=load
\`\`\`

### Docker Execution
\`\`\`bash
CLIENT=${CLIENT_NAME} TEST=example.ts docker-compose up
\`\`\`

## Configuration

Edit the configuration files in \`config/\` to customize:
- Base URL
- Scenarios (VUs, duration, executors)
- Thresholds (performance criteria)

## Adding New Tests

1. Create a new test file in \`scenarios/\`
2. Import necessary services from \`lib/services/\`
3. Define test logic using k6 API
4. Run the test using the CLI

## Data Files

- \`data/users.csv\` - Sample user data
- \`data/products.json\` - Sample product data

You can load this data in your tests using k6's \`SharedArray\` or the framework's data helpers.

## Services

Services are located in \`lib/services/\` and provide reusable API abstractions:

- \`ExampleService.ts\` - Example API service

Create new services by extending \`BaseService\` from \`shared/base-service.js\`.

## Next Steps

1. Update \`config/\` files with your actual API URLs
2. Add your service objects in \`lib/services/\`
3. Create test scenarios in \`scenarios/\`
4. Add test data in \`data/\`
5. Run tests locally or via CI/CD

For more information, see the [main documentation](../../docs/README.md).
EOF

# Create .gitignore
cat > "${CLIENT_DIR}/.gitignore" << 'EOF'
# Ignore sensitive data
*.env
*.key
*.pem
secrets/

# Ignore generated reports (these go to reports/ in root)
reports/
*.html
*.json
*.log

# Ignore temporary files
*.tmp
*.temp
.DS_Store

# Ignore node_modules if accidentally copied
node_modules/
EOF

echo ""
echo -e "${GREEN}✅ Client structure created successfully!${NC}"
echo ""
echo -e "${BLUE}📂 Created structure:${NC}"
tree -L 3 "$CLIENT_DIR" 2>/dev/null || find "$CLIENT_DIR" -print | sed -e 's;[^/]*/;|____;g;s;____|; |;g'

echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "  1. Update configuration files in ${CLIENT_DIR}/config/"
echo -e "  2. Add your service objects in ${CLIENT_DIR}/lib/services/"
echo -e "  3. Create test scenarios in ${CLIENT_DIR}/scenarios/"
echo -e "  4. Add test data in ${CLIENT_DIR}/data/"
echo -e "  5. Run your first test:"
echo -e "     ${BLUE}node dist/core/cli.js --client=${CLIENT_NAME} --test=example.ts${NC}"
echo ""
echo -e "${GREEN}🎉 Happy testing!${NC}"
