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

## 🔄 CI/CD Pipeline Execution

### GitHub Actions

#### Ejecución Manual desde la UI
1. Ve a la pestaña **Actions** en tu repositorio de GitHub
2. Selecciona el workflow **CI** en el panel izquierdo
3. Haz clic en **Run workflow** (botón en la parte superior derecha)
4. Completa los parámetros:
   - **Client**: `local`, `client-a`, etc.
   - **Environment**: `default`, `staging`, `prod`
   - **Test**: `example.ts`, `auth-flow.ts`, etc.
   - **Profile**: `smoke`, `load`, `stress` (opcional)
5. Haz clic en **Run workflow**

#### Ejecución via API/curl
```bash
# Generar un Personal Access Token en GitHub:
# Settings → Developer settings → Personal access tokens → Generate new token
# Permisos necesarios: repo, workflow

# Ejecutar workflow con parámetros
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/OWNER/REPO/actions/workflows/ci.yml/dispatches \
  -d '{
    "ref": "main",
    "inputs": {
      "client": "local",
      "env": "staging",
      "test": "auth-flow.ts",
      "profile": "load"
    }
  }'
```

#### Ejecución desde otro Workflow
```yaml
name: Trigger Tests

on:
  workflow_dispatch:

jobs:
  trigger:
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
              workflow_id: 'ci.yml',
              ref: 'main',
              inputs: {
                client: 'local',
                env: 'production',
                test: 'load-test.ts',
                profile: 'stress'
              }
            })
```

### GitLab CI

#### Ejecución Manual desde la UI
1. Ve a **CI/CD → Pipelines** en tu proyecto de GitLab
2. Haz clic en **Run pipeline** (botón en la parte superior derecha)
3. Selecciona la rama (ej: `main`)
4. Agrega variables:
   - `CLIENT`: `local`
   - `ENV`: `staging`
   - `TEST`: `auth-flow.ts`
   - `PROFILE`: `load`
5. Haz clic en **Run pipeline**

#### Ejecución via API/curl
```bash
# Generar un Personal Access Token en GitLab:
# Settings → Access Tokens → Add new token
# Scopes necesarios: api, read_api, write_repository

# Ejecutar pipeline con variables
curl -X POST \
  -H "PRIVATE-TOKEN: YOUR_GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/PROJECT_ID/pipeline" \
  -d "ref=main" \
  -d "variables[CLIENT]=local" \
  -d "variables[ENV]=staging" \
  -d "variables[TEST]=auth-flow.ts" \
  -d "variables[PROFILE]=load"
```

#### Ejecución desde otro Pipeline
```yaml
trigger_tests:
  stage: test
  script:
    - |
      curl -X POST \
        -H "PRIVATE-TOKEN: $CI_JOB_TOKEN" \
        "$CI_API_V4_URL/projects/$CI_PROJECT_ID/pipeline" \
        -d "ref=main" \
        -d "variables[CLIENT]=local" \
        -d "variables[ENV]=production" \
        -d "variables[TEST]=load-test.ts" \
        -d "variables[PROFILE]=stress"
  only:
    - schedules
```

### Parámetros Disponibles

| Parámetro | Descripción | Valores de Ejemplo | Requerido |
|-----------|-------------|-------------------|-----------|
| `client` | Cliente a probar | `local`, `client-a`, `production` | ✅ Sí |
| `env` | Entorno de ejecución | `default`, `staging`, `prod` | ✅ Sí |
| `test` | Archivo de test a ejecutar | `example.ts`, `auth-flow.ts`, `load-test.ts` | ✅ Sí |
| `profile` | Perfil de carga | `smoke`, `load`, `stress`, `spike` | ❌ No (default: smoke) |

### Ejemplos de Uso Común

#### Smoke Test Diario (Scheduled)
```yaml
# GitHub Actions (.github/workflows/scheduled-smoke.yml)
name: Daily Smoke Tests
on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC diariamente
  workflow_dispatch:

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Smoke Tests
        run: |
          node dist/core/cli.js --client=production --env=prod --test=smoke-suite.ts --profile=smoke
```

#### Load Test Pre-Deploy
```bash
# Ejecutar antes de un deploy a producción
curl -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/actions/workflows/ci.yml/dispatches \
  -d '{
    "ref": "main",
    "inputs": {
      "client": "production",
      "env": "staging",
      "test": "full-load-test.ts",
      "profile": "load"
    }
  }'
```

### Ejecución Config-Driven (Parámetros Dinámicos)

Para ejecutar tests con configuración dinámica (path, body, headers, método), usa el test `config-driven.ts` con un archivo de configuración personalizado:

#### Opción 1: Archivo de Configuración en el Repositorio

**1. Crear archivo de configuración** (ej: `configs/api-test.json`):
```json
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
    "http_req_failed": ["rate<0.01"]
  },
  "test_cases": [
    {
      "name": "Create User",
      "method": "POST",
      "path": "/api/users",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer ${__ENV.API_TOKEN}"
      },
      "body": {
        "name": "Test User",
        "email": "test@example.com",
        "role": "admin"
      },
      "expected_status": 201,
      "checks": [
        "response.json().id !== undefined",
        "response.json().email === 'test@example.com'"
      ]
    },
    {
      "name": "Get User",
      "method": "GET",
      "path": "/api/users/1",
      "headers": {
        "Authorization": "Bearer ${__ENV.API_TOKEN}"
      },
      "expected_status": 200,
      "checks": [
        "response.json().name !== undefined"
      ]
    },
    {
      "name": "Update User",
      "method": "PUT",
      "path": "/api/users/1",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer ${__ENV.API_TOKEN}"
      },
      "body": {
        "name": "Updated User",
        "status": "active"
      },
      "expected_status": 200
    },
    {
      "name": "Delete User",
      "method": "DELETE",
      "path": "/api/users/1",
      "headers": {
        "Authorization": "Bearer ${__ENV.API_TOKEN}"
      },
      "expected_status": 204
    }
  ]
}
```

**2. Ejecutar desde GitHub Actions:**
```yaml
# .github/workflows/api-test.yml
name: API Config-Driven Test

on:
  workflow_dispatch:
    inputs:
      config_file:
        description: 'Config file path'
        required: true
        default: 'configs/api-test.json'
      api_token:
        description: 'API Token'
        required: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Setup k6
        uses: grafana/setup-k6-action@v1
      - name: Run Config-Driven Test
        env:
          API_TOKEN: ${{ github.event.inputs.api_token }}
        run: |
          node dist/core/cli.js \
            --client=local \
            --test=config-driven.ts \
            --config=${{ github.event.inputs.config_file }}
```

**3. Ejecutar via API:**
```bash
curl -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/actions/workflows/api-test.yml/dispatches \
  -d '{
    "ref": "main",
    "inputs": {
      "config_file": "configs/api-test.json",
      "api_token": "your-api-token-here"
    }
  }'
```

#### Opción 2: Configuración desde Variable de Entorno (JSON inline)

**1. GitHub Actions con JSON inline:**
```yaml
name: Dynamic API Test

on:
  workflow_dispatch:
    inputs:
      test_config:
        description: 'Test configuration (JSON)'
        required: true
        default: |
          {
            "baseUrl": "https://api.example.com",
            "scenarios": {"default": {"executor": "constant-vus", "vus": 5, "duration": "10s"}},
            "test_cases": [
              {
                "name": "Health Check",
                "method": "GET",
                "path": "/health",
                "expected_status": 200
              }
            ]
          }

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup and Run Test
        run: |
          # Crear archivo temporal con la configuración
          echo '${{ github.event.inputs.test_config }}' > /tmp/test-config.json
          
          # Ejecutar test
          node dist/core/cli.js \
            --client=local \
            --test=config-driven.ts \
            --config=/tmp/test-config.json
```

**2. GitLab CI con JSON inline:**
```yaml
# .gitlab-ci.yml
dynamic_api_test:
  stage: test
  variables:
    TEST_CONFIG: |
      {
        "baseUrl": "https://api.example.com",
        "scenarios": {"default": {"executor": "constant-vus", "vus": 5, "duration": "10s"}},
        "test_cases": [
          {
            "name": "Create Resource",
            "method": "POST",
            "path": "/api/resources",
            "headers": {"Content-Type": "application/json"},
            "body": {"name": "Test", "type": "demo"},
            "expected_status": 201
          }
        ]
      }
  script:
    - echo "$TEST_CONFIG" > /tmp/test-config.json
    - node dist/core/cli.js --client=local --test=config-driven.ts --config=/tmp/test-config.json
  only:
    - web
```

**3. Ejecutar GitLab pipeline con configuración custom via API:**
```bash
# Crear configuración JSON
CONFIG_JSON=$(cat <<EOF
{
  "baseUrl": "https://api.staging.example.com",
  "scenarios": {
    "default": {
      "executor": "ramping-vus",
      "startVUs": 0,
      "stages": [
        {"duration": "30s", "target": 10},
        {"duration": "1m", "target": 10},
        {"duration": "30s", "target": 0}
      ]
    }
  },
  "test_cases": [
    {
      "name": "Login",
      "method": "POST",
      "path": "/auth/login",
      "headers": {"Content-Type": "application/json"},
      "body": {"username": "admin", "password": "secret"},
      "expected_status": 200,
      "checks": ["response.json().token !== undefined"]
    }
  ]
}
EOF
)

# Ejecutar pipeline
curl -X POST \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/PROJECT_ID/pipeline" \
  -d "ref=main" \
  -d "variables[TEST_CONFIG]=$CONFIG_JSON"
```

#### Ejemplo Completo: Test de API con Múltiples Métodos

```json
{
  "baseUrl": "https://jsonplaceholder.typicode.com",
  "scenarios": {
    "default": {
      "executor": "constant-vus",
      "vus": 5,
      "duration": "30s"
    }
  },
  "thresholds": {
    "http_req_duration": ["p(95)<500"],
    "http_req_failed": ["rate<0.01"],
    "checks": ["rate>0.95"]
  },
  "test_cases": [
    {
      "name": "GET - List Posts",
      "method": "GET",
      "path": "/posts",
      "expected_status": 200,
      "checks": [
        "Array.isArray(response.json())",
        "response.json().length > 0"
      ]
    },
    {
      "name": "GET - Single Post",
      "method": "GET",
      "path": "/posts/1",
      "expected_status": 200,
      "checks": [
        "response.json().id === 1",
        "response.json().title !== undefined"
      ]
    },
    {
      "name": "POST - Create Post",
      "method": "POST",
      "path": "/posts",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "title": "Test Post",
        "body": "This is a test post",
        "userId": 1
      },
      "expected_status": 201,
      "checks": [
        "response.json().id !== undefined",
        "response.json().title === 'Test Post'"
      ]
    },
    {
      "name": "PUT - Update Post",
      "method": "PUT",
      "path": "/posts/1",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "id": 1,
        "title": "Updated Title",
        "body": "Updated body",
        "userId": 1
      },
      "expected_status": 200,
      "checks": [
        "response.json().title === 'Updated Title'"
      ]
    },
    {
      "name": "PATCH - Partial Update",
      "method": "PATCH",
      "path": "/posts/1",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "title": "Patched Title"
      },
      "expected_status": 200
    },
    {
      "name": "DELETE - Remove Post",
      "method": "DELETE",
      "path": "/posts/1",
      "expected_status": 200
    }
  ]
}
```

**Ventajas del Enfoque Config-Driven:**
- ✅ No requiere escribir código TypeScript
- ✅ Configuración completamente dinámica desde el pipeline
- ✅ Soporte para todos los métodos HTTP (GET, POST, PUT, PATCH, DELETE)
- ✅ Headers y body personalizables
- ✅ Checks dinámicos con JavaScript
- ✅ Variables de entorno (`${__ENV.VAR_NAME}`)
- ✅ Fácil integración con CI/CD

## 📊 HTML Reports

Generate beautiful, detailed HTML reports from k6 JSON output:

```bash
# Run test with JSON output
k6 run --out json=output.json dist/clients/local/scenarios/example.js

# Generate HTML report
node bin/report.js --input=output.json --client=production --test=api-load-test

# Report will be generated in: reports/<test-name>/<test-name>_<timestamp>.html
```

**Report Features:**
- 📊 Interactive Chart.js visualizations
- 🎯 Grouped metrics by path/URL
- 🔴 Threshold violation highlighting
- 📄 Print-optimized for PDF export
- ⏰ Start/End timestamps and duration
- 📋 Detailed check results and statistics

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
