# k6 Extensions & Instrumentation Guide

This framework supports extending k6 functionality through **xk6 extensions** (custom binaries) and **jslib modules** (JavaScript libraries).

## 1. Instrumentation (Tracing & Profiling)

The framework includes built-in support for distributed tracing (Tempo) and profiling (Pyroscope) via `RequestHelper`.

### Enabling Tracing (Tempo)
To enable automatic propagation of `traceparent` headers for distributed tracing with Grafana Tempo:

1. Set the environment variable `K6_TEMPO_ENABLED=true`.
2. (Optional) Configure propagation format via `K6_TEMPO_PROPAGATION` (default: w3c).

```bash
K6_TEMPO_ENABLED=true ./bin/run-test.sh
```

### Enabling Profiling (Pyroscope)
To enable automatic profiling headers for Grafana Pyroscope:

1. Set the environment variable `K6_PYROSCOPE_ENABLED=true`.
2. Ensure your backend services are instrumented with Pyroscope.

```bash
K6_PYROSCOPE_ENABLED=true ./bin/run-test.sh
```

### How it works
The `RequestHelper` automatically wraps the k6 HTTP client with the appropriate instrumentation libraries when these flags are enabled. This ensures that all requests made through `RequestHelper` include the necessary headers for observability.

## 2. Using k6 Extensions (xk6)

k6 extensions allow you to use Go plugins in your tests (e.g., SQL, Kafka, Kubernetes).

### Step 1: Build a custom k6 binary
You need to build a k6 binary that includes the extensions you want.

```bash
# Install xk6
go install go.k6.io/xk6/cmd/xk6@latest

# Build k6 with extensions (example: SQL and Kafka)
xk6 build \
  --with github.com/grafana/xk6-sql \
  --with github.com/mostafa/xk6-kafka
```

This will create a `k6` binary in your current directory.

### Step 2: Use the custom binary
Tell the framework to use your custom binary instead of the system `k6`.

**Local Execution:**
```bash
# Set K6_BINARY_PATH to your custom binary
export K6_BINARY_PATH=./k6
node dist/core/cli.js --client=local --test=sql-test.ts
```

**Docker Execution:**
You will need to create a custom Docker image that includes your binary.
1. Create a `Dockerfile.custom`:
   ```dockerfile
   FROM grafana/k6:latest
   # Copy your custom binary or build it here
   COPY ./k6 /usr/bin/k6
   ```
2. Update `docker-compose.yml` to use this image.

### Step 3: Import in your tests
In your test scripts, import the extension modules:

```typescript
import sql from 'k6/x/sql';
import kafka from 'k6/x/kafka';

// ... use sql and kafka in your test
```

## 3. Using jslib Modules

[jslib.k6.io](https://jslib.k6.io/) hosts JavaScript libraries optimized for k6.

### Usage
Import directly from the URL in your TypeScript files:

```typescript
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { Httpx } from 'https://jslib.k6.io/httpx/0.1.0/index.js';
```

**Note:** You may need to add `// @ts-ignore` if TypeScript complains about remote imports, or configure a `d.ts` file mapping.
