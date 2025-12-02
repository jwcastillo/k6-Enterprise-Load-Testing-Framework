#!/usr/bin/env node

/**
 * Auto-Compare Results - Automatically compare with previous test executions
 * 
 * Features:
 * - Compares with last 5 executions automatically
 * - Identifies top 3 improvements and degradations
 * - Supports custom baseline via environment variable
 * - Generates detailed comparison report
 * 
 * Usage:
 *   node bin/testing/auto-compare.js --client=examples --test=auth-flow
 * 
 * Environment Variables:
 *   COMPARE_WITH - Comma-separated list of specific result files to compare
 *   MAX_HISTORY - Maximum number of historical results to compare (default: 5)
 */

import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import { globSync } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse arguments
const args = minimist(process.argv.slice(2));
const CLIENT = args.client;
const TEST = args.test;
const MAX_HISTORY = parseInt(process.env.MAX_HISTORY || '5');
const COMPARE_WITH = process.env.COMPARE_WITH ? process.env.COMPARE_WITH.split(',') : null;

if (!CLIENT || !TEST) {
  console.error('❌ Error: --client and --test are required');
  console.error('Usage: node bin/testing/auto-compare.js --client=examples --test=auth-flow');
  process.exit(1);
}

const testName = TEST.replace('.ts', '');
const reportsDir = path.join(process.cwd(), 'reports', CLIENT, testName);

if (!fs.existsSync(reportsDir)) {
  console.log(`ℹ️  No previous results found for ${CLIENT}/${testName}`);
  console.log('   This appears to be the first execution.');
  process.exit(0);
}

console.log('🔍 Auto-Compare: Analyzing Performance Trends');
console.log(`   Client: ${CLIENT}`);
console.log(`   Test: ${testName}`);
console.log('');

// Find all JSON result files
const allResults = globSync(path.join(reportsDir, 'k6-output-*.json'))
  .map(file => ({
    path: file,
    timestamp: fs.statSync(file).mtime.getTime(),
    name: path.basename(file)
  }))
  .sort((a, b) => b.timestamp - a.timestamp); // Most recent first

if (allResults.length === 0) {
  console.log('ℹ️  No JSON results found');
  process.exit(0);
}

// Determine which results to compare
let resultsToCompare;

if (COMPARE_WITH) {
  // Use specific files from environment variable
  console.log(`📌 Using custom baseline from COMPARE_WITH`);
  resultsToCompare = COMPARE_WITH.map(name => {
    const fullPath = path.join(reportsDir, name);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${name}`);
      process.exit(1);
    }
    return {
      path: fullPath,
      timestamp: fs.statSync(fullPath).mtime.getTime(),
      name: name
    };
  });
} else {
  // Use last N executions
  const historyCount = Math.min(MAX_HISTORY, allResults.length - 1);
  console.log(`📊 Comparing with last ${historyCount} execution(s)`);
  resultsToCompare = allResults.slice(1, historyCount + 1); // Skip first (current)
}

if (resultsToCompare.length === 0) {
  console.log('ℹ️  No previous results to compare');
  console.log('   Run the test at least twice to enable comparison.');
  process.exit(0);
}

const currentResult = allResults[0];
console.log(`   Current: ${currentResult.name}`);
resultsToCompare.forEach((r, i) => {
  console.log(`   Baseline ${i + 1}: ${r.name}`);
});
console.log('');

// Load and parse results
const current = JSON.parse(fs.readFileSync(currentResult.path, 'utf8'));
const baselines = resultsToCompare.map(r => ({
  name: r.name,
  data: JSON.parse(fs.readFileSync(r.path, 'utf8')),
  timestamp: r.timestamp
}));

// Metrics to compare
const metricsConfig = [
  { key: 'http_req_duration', name: 'Response Time (avg)', prop: 'avg', unit: 'ms', lowerIsBetter: true },
  { key: 'http_req_duration', name: 'Response Time (p95)', prop: 'p(95)', unit: 'ms', lowerIsBetter: true },
  { key: 'http_req_duration', name: 'Response Time (p99)', prop: 'p(99)', unit: 'ms', lowerIsBetter: true },
  { key: 'http_reqs', name: 'Throughput', prop: 'rate', unit: 'req/s', lowerIsBetter: false },
  { key: 'http_req_failed', name: 'Error Rate', prop: 'rate', unit: '%', lowerIsBetter: true, multiply: 100 },
  { key: 'checks', name: 'Check Pass Rate', prop: 'rate', unit: '%', lowerIsBetter: false, multiply: 100 },
  { key: 'iterations', name: 'Iterations', prop: 'count', unit: '', lowerIsBetter: false },
  { key: 'vus', name: 'Virtual Users (max)', prop: 'max', unit: '', lowerIsBetter: false }
];

// Calculate comparisons
const comparisons = [];

metricsConfig.forEach(metric => {
  const currMetric = current.metrics[metric.key];
  if (!currMetric) return;

  const currVal = currMetric.values ? currMetric.values[metric.prop] : currMetric[metric.prop];
  if (currVal === undefined) return;

  const finalCurrVal = metric.multiply ? currVal * metric.multiply : currVal;

  // Compare with each baseline
  baselines.forEach((baseline, idx) => {
    const baseMetric = baseline.data.metrics[metric.key];
    if (!baseMetric) return;

    const baseVal = baseMetric.values ? baseMetric.values[metric.prop] : baseMetric[metric.prop];
    if (baseVal === undefined) return;

    const finalBaseVal = metric.multiply ? baseVal * metric.multiply : baseVal;

    // Calculate difference
    const diff = finalCurrVal - finalBaseVal;
    const diffPercent = baseVal !== 0 ? (diff / finalBaseVal) * 100 : 0;

    // Determine if this is improvement or degradation
    let isImprovement = false;
    let isDegradation = false;

    if (metric.lowerIsBetter) {
      isImprovement = diff < 0;
      isDegradation = diff > 0;
    } else {
      isImprovement = diff > 0;
      isDegradation = diff < 0;
    }

    comparisons.push({
      metric: metric.name,
      current: finalCurrVal,
      baseline: finalBaseVal,
      diff: diff,
      diffPercent: diffPercent,
      unit: metric.unit,
      isImprovement: isImprovement,
      isDegradation: isDegradation,
      baselineName: baseline.name,
      baselineIndex: idx
    });
  });
});

// Find top 3 improvements and degradations
const improvements = comparisons
  .filter(c => c.isImprovement && Math.abs(c.diffPercent) > 1) // At least 1% change
  .sort((a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent))
  .slice(0, 3);

const degradations = comparisons
  .filter(c => c.isDegradation && Math.abs(c.diffPercent) > 1) // At least 1% change
  .sort((a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent))
  .slice(0, 3);

// Print results
console.log('═'.repeat(70));
console.log('📈 TOP 3 IMPROVEMENTS');
console.log('═'.repeat(70));

if (improvements.length === 0) {
  console.log('   No significant improvements detected');
} else {
  improvements.forEach((imp, idx) => {
    console.log(`\n${idx + 1}. ${imp.metric}`);
    console.log(`   Current:  ${imp.current.toFixed(2)} ${imp.unit}`);
    console.log(`   Baseline: ${imp.baseline.toFixed(2)} ${imp.unit} (${imp.baselineName})`);
    console.log(`   Change:   ${imp.diffPercent > 0 ? '+' : ''}${imp.diffPercent.toFixed(2)}% ✅`);
  });
}

console.log('\n' + '═'.repeat(70));
console.log('📉 TOP 3 DEGRADATIONS');
console.log('═'.repeat(70));

if (degradations.length === 0) {
  console.log('   No significant degradations detected ✅');
} else {
  degradations.forEach((deg, idx) => {
    console.log(`\n${idx + 1}. ${deg.metric}`);
    console.log(`   Current:  ${deg.current.toFixed(2)} ${deg.unit}`);
    console.log(`   Baseline: ${deg.baseline.toFixed(2)} ${deg.unit} (${deg.baselineName})`);
    console.log(`   Change:   ${deg.diffPercent > 0 ? '+' : ''}${deg.diffPercent.toFixed(2)}% ⚠️`);
  });
}

// Summary comparison table
console.log('\n' + '═'.repeat(70));
console.log('📊 DETAILED COMPARISON (vs Most Recent Baseline)');
console.log('═'.repeat(70));

const mostRecentBaseline = baselines[0];
const summaryTable = [];

metricsConfig.forEach(metric => {
  const currMetric = current.metrics[metric.key];
  if (!currMetric) return;

  const currVal = currMetric.values ? currMetric.values[metric.prop] : currMetric[metric.prop];
  if (currVal === undefined) return;

  const finalCurrVal = metric.multiply ? currVal * metric.multiply : currVal;

  const baseMetric = mostRecentBaseline.data.metrics[metric.key];
  if (!baseMetric) return;

  const baseVal = baseMetric.values ? baseMetric.values[metric.prop] : baseMetric[metric.prop];
  if (baseVal === undefined) return;

  const finalBaseVal = metric.multiply ? baseVal * metric.multiply : baseVal;

  const diff = finalCurrVal - finalBaseVal;
  const diffPercent = baseVal !== 0 ? (diff / finalBaseVal) * 100 : 0;

  let status = '➡️';
  if (Math.abs(diffPercent) > 5) {
    if (metric.lowerIsBetter) {
      status = diff < 0 ? '✅' : '❌';
    } else {
      status = diff > 0 ? '✅' : '❌';
    }
  }

  summaryTable.push({
    Metric: metric.name,
    Current: `${finalCurrVal.toFixed(2)} ${metric.unit}`,
    Baseline: `${finalBaseVal.toFixed(2)} ${metric.unit}`,
    Change: `${diffPercent > 0 ? '+' : ''}${diffPercent.toFixed(2)}%`,
    Status: status
  });
});

console.table(summaryTable);

// Generate comparison report file
const reportPath = path.join(reportsDir, `comparison-${Date.now()}.md`);
const reportContent = generateMarkdownReport(
  CLIENT,
  testName,
  currentResult,
  baselines,
  improvements,
  degradations,
  summaryTable
);

fs.writeFileSync(reportPath, reportContent);

console.log('\n' + '═'.repeat(70));
console.log(`📄 Comparison report saved: ${path.relative(process.cwd(), reportPath)}`);
console.log('═'.repeat(70));

// Exit with appropriate code
if (degradations.length > 0 && degradations.some(d => Math.abs(d.diffPercent) > 10)) {
  console.log('\n⚠️  WARNING: Significant performance degradation detected (>10%)');
  process.exit(1);
} else {
  console.log('\n✅ Performance comparison complete');
  process.exit(0);
}

// Helper function to generate markdown report
function generateMarkdownReport(client, test, current, baselines, improvements, degradations, summaryTable) {
  const date = new Date().toISOString();
  
  let md = `# Performance Comparison Report\n\n`;
  md += `**Client**: ${client}\n`;
  md += `**Test**: ${test}\n`;
  md += `**Date**: ${date}\n`;
  md += `**Current Result**: ${current.name}\n\n`;
  
  md += `## Baselines Compared\n\n`;
  baselines.forEach((b, i) => {
    md += `${i + 1}. ${b.name}\n`;
  });
  
  md += `\n## Top 3 Improvements\n\n`;
  if (improvements.length === 0) {
    md += `No significant improvements detected.\n`;
  } else {
    improvements.forEach((imp, idx) => {
      md += `### ${idx + 1}. ${imp.metric}\n\n`;
      md += `- **Current**: ${imp.current.toFixed(2)} ${imp.unit}\n`;
      md += `- **Baseline**: ${imp.baseline.toFixed(2)} ${imp.unit} (${imp.baselineName})\n`;
      md += `- **Change**: ${imp.diffPercent > 0 ? '+' : ''}${imp.diffPercent.toFixed(2)}% ✅\n\n`;
    });
  }
  
  md += `## Top 3 Degradations\n\n`;
  if (degradations.length === 0) {
    md += `No significant degradations detected. ✅\n`;
  } else {
    degradations.forEach((deg, idx) => {
      md += `### ${idx + 1}. ${deg.metric}\n\n`;
      md += `- **Current**: ${deg.current.toFixed(2)} ${deg.unit}\n`;
      md += `- **Baseline**: ${deg.baseline.toFixed(2)} ${deg.unit} (${deg.baselineName})\n`;
      md += `- **Change**: ${deg.diffPercent > 0 ? '+' : ''}${deg.diffPercent.toFixed(2)}% ⚠️\n\n`;
    });
  }
  
  md += `## Detailed Comparison\n\n`;
  md += `| Metric | Current | Baseline | Change | Status |\n`;
  md += `|--------|---------|----------|--------|--------|\n`;
  summaryTable.forEach(row => {
    md += `| ${row.Metric} | ${row.Current} | ${row.Baseline} | ${row.Change} | ${row.Status} |\n`;
  });
  
  return md;
}
