# Grafana Dashboards for k6 Enterprise

This directory contains pre-built Grafana dashboards for visualizing k6 load testing metrics.

## Prerequisites

1. **Grafana** (v8.0+)
2. **Prometheus** data source configured in Grafana
3. k6 configured to export metrics to Prometheus (see main README)

## Available Dashboards

### k6 Enterprise Load Testing Dashboard

**File**: `k6-dashboard.json`

**Panels**:
- **HTTP Request Duration**: p95, p99, and average response times
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests (gauge with thresholds)
- **Active VUs**: Current number of virtual users
- **Checks Status**: Pass/Fail status of k6 checks

## Import Instructions

### Method 1: Via Grafana UI

1. Open Grafana
2. Navigate to **Dashboards** → **Import**
3. Click **Upload JSON file**
4. Select `k6-dashboard.json`
5. Select your Prometheus data source
6. Click **Import**

### Method 2: Via API

```bash
curl -X POST \
  http://localhost:3000/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -d @k6-dashboard.json
```

### Method 3: Provisioning (Recommended for Production)

Create a provisioning file in your Grafana instance:

**File**: `/etc/grafana/provisioning/dashboards/k6.yaml`

```yaml
apiVersion: 1

providers:
  - name: 'k6-dashboards'
    orgId: 1
    folder: 'Load Testing'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /path/to/fmw/observability/grafana
```

## Data Source Configuration

The dashboard expects a Prometheus data source with k6 metrics. Ensure your k6 tests are configured to export to Prometheus:

```bash
K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
npm start -- --client=examples --test=scenarios/ecommerce-flow.ts
```

## Customization

You can customize the dashboard by:
- Adjusting threshold values in gauge panels
- Adding new panels for custom metrics
- Modifying time ranges and refresh intervals
- Adding template variables for filtering by client or test name

## Metrics Reference

The dashboard uses the following k6 metrics:

| Metric | Description |
|--------|-------------|
| `k6_http_req_duration` | HTTP request duration (with quantiles) |
| `k6_http_reqs` | Total HTTP requests counter |
| `k6_http_req_failed` | Failed HTTP requests counter |
| `k6_vus` | Current number of active VUs |
| `k6_checks` | Check results (pass/fail) |

For a complete list of k6 metrics, see: https://k6.io/docs/using-k6/metrics/
