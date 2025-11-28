#!/usr/bin/env node

/**
 * Result Comparison Tool for k6 Framework
 * 
 * Usage: node bin/compare-results.js --baseline=report-A.json --current=report-B.json
 */

const fs = require('fs');
const minimist = require('minimist');
const path = require('path');

// Parse arguments
const args = minimist(process.argv.slice(2));
const BASELINE_FILE = args.baseline;
const CURRENT_FILE = args.current;
const THRESHOLD = args.threshold || 10; // % allowed degradation

if (!BASELINE_FILE || !CURRENT_FILE) {
  console.error('❌ Error: --baseline and --current arguments are required');
  process.exit(1);
}

console.log(`📉 Comparing Results`);
console.log(`   Baseline: ${BASELINE_FILE}`);
console.log(`   Current:  ${CURRENT_FILE}`);
console.log(`   Threshold: ${THRESHOLD}%`);

try {
  const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
  const current = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf8'));

  const metrics = [
    { key: 'http_req_duration', name: 'Response Time (avg)', prop: 'avg' },
    { key: 'http_req_duration', name: 'Response Time (p95)', prop: 'p(95)' },
    { key: 'http_reqs', name: 'Throughput (req/s)', prop: 'rate', inverse: true }, // Higher is better
    { key: 'http_req_failed', name: 'Error Rate', prop: 'rate' }
  ];

  let failed = false;
  const table = [];

  metrics.forEach(metric => {
    // Extract values safely
    const baseMetric = baseline.metrics[metric.key];
    const currMetric = current.metrics[metric.key];

    if (!baseMetric || !currMetric) {
      return;
    }

    const baseVal = baseMetric.values ? baseMetric.values[metric.prop] : baseMetric[metric.prop];
    const currVal = currMetric.values ? currMetric.values[metric.prop] : currMetric[metric.prop];

    if (baseVal === undefined || currVal === undefined) return;

    // Calculate difference percentage
    let diff = 0;
    if (baseVal !== 0) {
      diff = ((currVal - baseVal) / baseVal) * 100;
    }

    // Determine status
    let status = '✅';
    let isRegression = false;

    if (metric.inverse) {
      // Higher is better (e.g. throughput)
      // If current is lower than baseline by more than threshold -> FAIL
      if (diff < -THRESHOLD) {
        status = '❌';
        isRegression = true;
      }
    } else {
      // Lower is better (e.g. latency, errors)
      // If current is higher than baseline by more than threshold -> FAIL
      if (diff > THRESHOLD) {
        status = '❌';
        isRegression = true;
      }
    }

    if (isRegression) failed = true;

    table.push({
      Metric: metric.name,
      Baseline: baseVal.toFixed(2),
      Current: currVal.toFixed(2),
      Diff: `${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`,
      Status: status
    });
  });

  console.table(table);

  if (failed) {
    console.error(`\n❌ REGRESSION DETECTED: Performance degraded by more than ${THRESHOLD}%`);
    process.exit(1);
  } else {
    console.log(`\n✅ No significant regression detected.`);
  }

} catch (err) {
  console.error(`❌ Error comparing files:`, err.message);
  process.exit(1);
}
