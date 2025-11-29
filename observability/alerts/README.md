# Alert Rules for k6 Enterprise

This directory contains alert rules for monitoring k6 load tests.

## Available Alert Rules

### Prometheus AlertManager Rules

**File**: `k6-alerts.yaml`

**Alerts**:
- **HighErrorRate**: Triggers when error rate > 5% for 2 minutes (Critical)
- **SlowResponseTime**: Triggers when p95 > 500ms for 2 minutes (Warning)
- **VerySlowResponseTime**: Triggers when p99 > 1000ms for 2 minutes (Critical)
- **ThresholdViolation**: Triggers when any k6 check fails (Warning)
- **LowThroughput**: Triggers when throughput < 10 req/s for 3 minutes (Warning)

### Grafana-Native Alerts

**File**: `grafana-alerts.json`

**Alerts**:
- **High Error Rate**: Error rate > 5%
- **Slow Response Time**: p95 > 500ms

## Setup Instructions

### Prometheus AlertManager

1. Copy `k6-alerts.yaml` to your Prometheus rules directory:
   ```bash
   cp k6-alerts.yaml /etc/prometheus/rules/
   ```

2. Update `prometheus.yml` to include the rules:
   ```yaml
   rule_files:
     - "/etc/prometheus/rules/*.yaml"
   ```

3. Reload Prometheus:
   ```bash
   curl -X POST http://localhost:9090/-/reload
   ```

### Grafana Alerts (Grafana 8+)

1. Navigate to **Alerting** → **Alert rules** in Grafana
2. Click **Import**
3. Paste the contents of `grafana-alerts.json`
4. Configure contact points (Slack, Discord, Email, etc.)

## Customization

You can customize the alert thresholds by editing the YAML/JSON files:

**Example**: Change error rate threshold from 5% to 3%

```yaml
# In k6-alerts.yaml
- alert: HighErrorRate
  expr: (sum(rate(k6_http_req_failed[1m])) / sum(rate(k6_http_reqs[1m]))) * 100 > 3  # Changed from 5
```

## Alert Routing

Configure AlertManager to route alerts to different channels based on severity:

```yaml
# alertmanager.yml
route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
    - match:
        severity: warning
      receiver: 'slack'

receivers:
  - name: 'default'
    webhook_configs:
      - url: 'http://localhost:3001/webhook'
  - name: 'slack'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
```

## Testing Alerts

To test if alerts are working:

1. Run a test that intentionally violates thresholds:
   ```bash
   K6_CHAOS_ENABLED=true K6_CHAOS_RATE=0.5 \
   npm start -- --client=examples --test=scenarios/auth-flow.ts
   ```

2. Check AlertManager UI: `http://localhost:9093`
3. Verify alerts appear in your configured notification channels
