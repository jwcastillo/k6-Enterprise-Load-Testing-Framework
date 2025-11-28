#!/usr/bin/env node

/**
 * report.js - Generate HTML test reports from k6 JSON output
 * 
 * Usage:
 *   k6 run --out json=output.json test.js
 *   node bin/report.js --input=output.json --output=report.html
 * 
 * Or pipe k6 output directly:
 *   k6 run --out json=- test.js | node bin/report.js --output=report.html
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
  const [key, value] = arg.split('=');
  options[key.replace('--', '')] = value;
});

// Generate timestamp for report filename
const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];

// Extract test name from input file if not provided
let testName = options.test || 'test';
if (options.input && !options.test) {
  const basename = path.basename(options.input, '.json');
  testName = basename.replace(/_output$/, '').replace(/_/g, '-');
}

// Default output: reports/<test-name>/<test-name>_<timestamp>.html
const defaultOutput = path.join('reports', testName, `${testName}_${timestamp}.html`);
const { input, output = defaultOutput, test = testName } = options;

if (!input && process.stdin.isTTY) {
  console.error('Usage: node bin/report.js --input=<json-file> [--output=<html-file>] [--test=<test-name>]');
  console.error('   or: k6 run --out json=- test.js | node bin/report.js [--output=<html-file>] [--test=<test-name>]');
  console.error('');
  console.error('Options:');
  console.error('  --input   Input JSON file from k6 (optional if piping)');
  console.error('  --output  Output HTML file (default: reports/<test-name>/<test-name>_<timestamp>.html)');
  console.error('  --test    Test name for organizing reports (default: extracted from input filename)');
  console.error('');
  console.error('Examples:');
  console.error('  node bin/report.js --input=output.json');
  console.error('  node bin/report.js --input=output.json --test=api-test');
  console.error('  k6 run --out json=output.json test.js && node bin/report.js --input=output.json');
  process.exit(1);
}

/**
 * Parse k6 JSON output and aggregate metrics
 */
function parseK6Output(jsonLines) {
  const metrics = {};
  const checks = {};
  let testInfo = {
    startTime: null,
    endTime: null,
    duration: 0,
    vus: 0,
    iterations: 0
  };
  const groupedMetrics = {};

  // Key metrics we want to track
  const keyMetrics = {
    http_req_waiting: 'TTFB (Time to First Byte)',
    http_req_duration: 'Request Duration',
    http_reqs: 'HTTP Requests',
    http_req_failed: 'Failed Requests',
    iterations: 'Iterations',
    vus: 'Virtual Users',
    data_received: 'Data Received',
    data_sent: 'Data Sent'
  };

  jsonLines.forEach(line => {
    try {
      const data = JSON.parse(line);
      
      if (data.type === 'Metric') {
        const { metric, data: metricData } = data;
        
        if (!metrics[metric]) {
          metrics[metric] = {
            type: metricData.type,
            values: [],
            tags: metricData.tags || {},
            displayName: keyMetrics[metric] || metric
          };
        }
      }
      
      if (data.type === 'Point') {
        const { metric, data: pointData } = data;
        
        // Initialize metric if not exists (sometimes Points come before Metric defs or for custom metrics)
        if (!metrics[metric]) {
           metrics[metric] = {
            type: 'trend', // default assumption
            values: [],
            tags: {},
            displayName: keyMetrics[metric] || metric
          };
        }

        // Add value to metric
        // Only add if it's a number (checks are handled separately below, but they are also metrics)
        if (typeof pointData.value === 'number') {
             metrics[metric].values.push(pointData.value);
        }
        
        const tags = pointData.tags || {};
        const group = tags.group || '';
        const name = tags.name || tags.url || 'unknown';

        // Grouped Metrics Logic
        // We only care about HTTP metrics for grouping usually
        if (metric.startsWith('http_req')) {
            if (!groupedMetrics[group]) groupedMetrics[group] = {};
            if (!groupedMetrics[group][name]) groupedMetrics[group][name] = {};
            if (!groupedMetrics[group][name][metric]) {
                groupedMetrics[group][name][metric] = {
                    values: []
                };
            }
            if (typeof pointData.value === 'number') {
                groupedMetrics[group][name][metric].values.push(pointData.value);
            }
        }
        
        // Track checks
        if (metric === 'checks') {
          const checkName = pointData.tags?.check || 'unknown';
          if (!checks[checkName]) {
            checks[checkName] = { passed: 0, failed: 0 };
          }
          if (pointData.value === 1) {
            checks[checkName].passed++;
          } else {
            checks[checkName].failed++;
          }
        }
        
        // Track VUs and iterations
        if (metric === 'vus' && pointData.value > testInfo.vus) {
          testInfo.vus = pointData.value;
        }
        if (metric === 'iterations') {
          testInfo.iterations++;
        }
        
        // Track test duration
        if (!testInfo.startTime) {
          testInfo.startTime = pointData.time;
        }
        testInfo.endTime = pointData.time;
      }
    } catch (e) {
      // Skip invalid JSON lines
    }
  });

  if (testInfo.startTime && testInfo.endTime) {
    testInfo.duration = new Date(testInfo.endTime) - new Date(testInfo.startTime);
  }

  return { metrics, checks, testInfo, groupedMetrics };
}

/**
 * Calculate statistics from metric values
 */
function calculateStats(values) {
  if (values.length === 0) return null;
  
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / values.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p90: sorted[Math.floor(sorted.length * 0.9)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)]
  };
}

/**
 * Generate HTML report
 */
function generateHTML(metrics, checks, testInfo) {
  const checkStats = Object.entries(checks).map(([name, data]) => ({
    name,
    passed: data.passed,
    failed: data.failed,
    total: data.passed + data.failed,
    rate: ((data.passed / (data.passed + data.failed)) * 100).toFixed(2)
  }));

  const totalChecks = checkStats.reduce((sum, c) => sum + c.total, 0);
  const passedChecks = checkStats.reduce((sum, c) => sum + c.passed, 0);
  const overallRate = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(2) : 0;

  const metricStats = Object.entries(metrics)
    .filter(([name]) => !name.startsWith('data_'))
    .map(([name, data]) => ({
      name,
      stats: calculateStats(data.values),
      type: data.type
    }))
    .filter(m => m.stats);

  const duration = testInfo.duration ? (testInfo.duration / 1000).toFixed(2) : 'N/A';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>k6 Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 1.1em; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8f9fa;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }
    .stat-card h3 {
      color: #666;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .stat-card .value {
      font-size: 2em;
      font-weight: bold;
      color: #667eea;
    }
    .stat-card.success .value { color: #10b981; }
    .stat-card.warning .value { color: #f59e0b; }
    .stat-card.danger .value { color: #ef4444; }
    .section {
      padding: 40px;
    }
    .section h2 {
      font-size: 1.8em;
      margin-bottom: 20px;
      color: #333;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      font-size: 0.85em;
      letter-spacing: 0.5px;
    }
    tr:hover { background: #f8f9fa; }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 600;
    }
    .badge.success { background: #d1fae5; color: #065f46; }
    .badge.danger { background: #fee2e2; color: #991b1b; }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #059669);
      transition: width 0.3s ease;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 0.9em;
      background: #f8f9fa;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 k6 Test Report</h1>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
      <div class="stat-card ${overallRate >= 90 ? 'success' : overallRate >= 70 ? 'warning' : 'danger'}">
        <h3>Check Success Rate</h3>
        <div class="value">${overallRate}%</div>
      </div>
      <div class="stat-card">
        <h3>Total Checks</h3>
        <div class="value">${totalChecks}</div>
      </div>
      <div class="stat-card success">
        <h3>Passed</h3>
        <div class="value">${passedChecks}</div>
      </div>
      <div class="stat-card ${totalChecks - passedChecks > 0 ? 'danger' : ''}">
        <h3>Failed</h3>
        <div class="value">${totalChecks - passedChecks}</div>
      </div>
      <div class="stat-card">
        <h3>Duration</h3>
        <div class="value">${duration}s</div>
      </div>
      ${metrics.http_req_waiting ? `
      <div class="stat-card">
        <h3>TTFB P90</h3>
        <div class="value">${calculateStats(metrics.http_req_waiting.values).p90.toFixed(2)}ms</div>
      </div>
      <div class="stat-card">
        <h3>TTFB P95</h3>
        <div class="value">${calculateStats(metrics.http_req_waiting.values).p95.toFixed(2)}ms</div>
      </div>
      <div class="stat-card">
        <h3>TTFB P99</h3>
        <div class="value">${calculateStats(metrics.http_req_waiting.values).p99.toFixed(2)}ms</div>
      </div>
      ` : ''}
      ${metrics.http_reqs ? `
      <div class="stat-card">
        <h3>RPS (Avg)</h3>
        <div class="value">${(metrics.http_reqs.values.length / (testInfo.duration / 1000)).toFixed(2)}</div>
      </div>
      ` : ''}
      ${testInfo.vus > 0 ? `
      <div class="stat-card">
        <h3>Max VUs</h3>
        <div class="value">${testInfo.vus}</div>
      </div>
      ` : ''}
      ${testInfo.iterations > 0 ? `
      <div class="stat-card">
        <h3>Iterations</h3>
        <div class="value">${testInfo.iterations}</div>
      </div>
      ` : ''}
    </div>

    <div class="section">
      <h2>📊 Check Results</h2>
      <table>
        <thead>
          <tr>
            <th>Check Name</th>
            <th>Status</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Total</th>
            <th>Success Rate</th>
          </tr>
        </thead>
        <tbody>
          ${checkStats.map(check => `
            <tr>
              <td><strong>${check.name}</strong></td>
              <td>
                <span class="badge ${check.failed === 0 ? 'success' : 'danger'}">
                  ${check.failed === 0 ? '✓ PASS' : '✗ FAIL'}
                </span>
              </td>
              <td>${check.passed}</td>
              <td>${check.failed}</td>
              <td>${check.total}</td>
              <td>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${check.rate}%"></div>
                </div>
                ${check.rate}%
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>📈 Performance Metrics</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Min</th>
            <th>Avg</th>
            <th>Median</th>
            <th>P90</th>
            <th>P95</th>
            <th>Max</th>
          </tr>
        </thead>
        <tbody>
          ${metricStats.map(metric => `
            <tr>
              <td><strong>${metric.name}</strong></td>
              <td>${metric.stats.min.toFixed(2)}</td>
              <td>${metric.stats.avg.toFixed(2)}</td>
              <td>${metric.stats.median.toFixed(2)}</td>
              <td>${metric.stats.p90.toFixed(2)}</td>
              <td>${metric.stats.p95.toFixed(2)}</td>
              <td>${metric.stats.max.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      Generated by k6 Enterprise Framework Report Generator
    </div>
  </div>
</body>
</html>`;
}

// Main execution
async function main() {
  let jsonData = '';

  if (input) {
    // Read from file
    console.log(`📖 Reading k6 output from: ${input}`);
    jsonData = await fs.readFile(input, 'utf-8');
  } else {
    // Read from stdin
    console.log('📖 Reading k6 output from stdin...');
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    jsonData = Buffer.concat(chunks).toString('utf-8');
  }

  const lines = jsonData.trim().split('\n').filter(line => line.trim());
  console.log(`🔍 Parsing ${lines.length} JSON lines...`);

  const { metrics, checks, testInfo, groupedMetrics } = parseK6Output(lines);
  
  console.log(`📊 Found ${Object.keys(metrics).length} metrics`);
  console.log(`✅ Found ${Object.keys(checks).length} checks`);

  // Calculate stats for all metrics
  const fullMetrics = {};
  Object.keys(metrics).forEach(name => {
      if (!name.startsWith('data_')) {
          fullMetrics[name] = calculateStats(metrics[name].values);
      }
  });

  // Calculate stats for grouped metrics
  const fullGroupedMetrics = {};
  Object.keys(groupedMetrics).forEach(group => {
      fullGroupedMetrics[group] = {};
      Object.keys(groupedMetrics[group]).forEach(name => {
          fullGroupedMetrics[group][name] = {};
          Object.keys(groupedMetrics[group][name]).forEach(metric => {
              fullGroupedMetrics[group][name][metric] = calculateStats(groupedMetrics[group][name][metric].values);
          });
      });
  });

  const html = generateHTML(metrics, checks, testInfo);
  
  const outputPath = path.resolve(output);
  
  // Ensure directory exists
  await fs.ensureDir(path.dirname(outputPath));
  
  // Write HTML report
  await fs.writeFile(outputPath, html);
  
  // Create enriched metadata file
  const metadataPath = outputPath.replace('.html', '_metadata.json');
  const metadata = {
    testInfo: {
        name: test,
        timestamp: now.toISOString(),
        duration: testInfo.duration,
        vus: testInfo.vus,
        iterations: testInfo.iterations
    },
    files: {
        report: path.basename(outputPath),
        input: input || 'stdin'
    },
    summary: {
        totalChecks: Object.values(checks).reduce((sum, c) => sum + c.passed + c.failed, 0),
        passedChecks: Object.values(checks).reduce((sum, c) => sum + c.passed, 0),
        failedChecks: Object.values(checks).reduce((sum, c) => sum + c.failed, 0),
    },
    checks: checks,
    metrics: fullMetrics,
    groupedMetrics: fullGroupedMetrics
  };
  
  await fs.writeJson(metadataPath, metadata, { spaces: 2 });
  
  console.log('');
  console.log('✅ Report generated successfully!');
  console.log(`📁 Report: ${outputPath}`);
  console.log(`📄 Metadata: ${metadataPath}`);
  console.log(`🌐 Open in browser: file://${outputPath}`);
  console.log('');
  console.log(`📊 Summary:`);
  console.log(`   Test: ${test}`);
  console.log(`   Checks: ${metadata.summary.passedChecks}/${metadata.summary.totalChecks} passed`);
  console.log(`   Duration: ${(testInfo.duration / 1000).toFixed(2)}s`);
}

main().catch(err => {
  console.error('❌ Error generating report:', err);
  process.exit(1);
});
