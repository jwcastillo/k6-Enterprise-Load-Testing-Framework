# Performance Benchmarks 📊

This document outlines the performance characteristics of the k6 Enterprise Framework and provides guidelines for benchmarking your own applications.

## Framework Overhead

The framework adds a minimal overhead on top of standard k6 scripts due to:
- TypeScript compilation (build time only)
- `RequestHelper` wrappers (logging, debugging, chaos checks)
- Dynamic configuration loading

### Baseline Metrics

| Scenario | VUs | Throughput (req/s) | Avg Latency (ms) | Overhead (est) |
|----------|-----|--------------------|------------------|----------------|
| Baseline | 1   | ~500               | ~2ms             | < 0.5ms        |
| Heavy    | 100 | ~5000              | ~50ms            | < 1ms          |

*Note: These metrics depend heavily on the machine running the tests.*

## Running Benchmarks

To run the internal benchmarks:

```bash
# Start the mock server first
npm run mock -- --client=benchmark

# Run baseline test
npm start -- --client=benchmark --test=baseline.ts

# Run heavy load test
npm start -- --client=benchmark --test=heavy-load.ts
```

## Recommendations

1. **Resource Usage**: Monitor CPU and Memory of the load generator. If CPU > 80%, your results may be skewed by the generator itself.
2. **Distributed Testing**: For > 5000 VUs, consider running k6 in distributed mode (e.g., k6-operator on Kubernetes).
3. **Logging**: Disable `K6_DEBUG` and `K6_CHAOS_ENABLED` during performance runs to minimize I/O overhead.
