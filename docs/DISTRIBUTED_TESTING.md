# Distributed Testing with k6-operator 🌍

This framework is designed to work seamlessly with the [k6-operator](https://github.com/grafana/k6-operator) for distributed load testing on Kubernetes.

## Prerequisites

1. A Kubernetes cluster
2. `k6-operator` installed in the cluster
3. The framework Docker image published to a registry accessible by the cluster

## Execution Flow

1. **Build & Push**: The framework image is built and pushed to your registry (e.g., via CI/CD).
2. **Deploy CRD**: You apply a `K6` Custom Resource Definition (CRD) to the cluster.
3. **Orchestration**: The operator spins up a starter pod and multiple runner pods.
4. **Execution**: Each runner executes a slice of the test (if using `parallelism`).

## Example CRD

See `k6-operator/example-crd.yaml` for a complete example.

```yaml
apiVersion: k6.io/v1alpha1
kind: K6
metadata:
  name: k6-distributed-test
spec:
  parallelism: 4
  script:
    configMap:
      name: my-test-script
      file: archive.tar
  runner:
    image: ghcr.io/your-org/k6-enterprise-framework:latest
    env:
      - name: K6_TEST_FILE
        value: "scenarios/ecommerce-flow.ts"
```

## Important Notes

- **Archive Mode**: For distributed testing, it's often easier to bundle the entire project into the Docker image rather than using `k6 archive`. Our Docker image contains the full source code.
- **Command Override**: The operator expects to run the `k6` binary directly. Since our entrypoint is `node dist/core/cli.js`, you might need to adjust the `command` or `args` in the CRD if the operator doesn't support custom entrypoints easily.
- **Alternative**: Use the provided Helm chart (`charts/k6-enterprise`) which deploys a Kubernetes Job. This is simpler for non-distributed tests but can also scale if you manually partition data.
