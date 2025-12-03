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
let clientName = 'unknown';

if (options.input && !options.test) {
  const basename = path.basename(options.input, '.json');
  testName = basename.replace(/_output$/, '').replace(/_/g, '-');
}

// Try to extract client name from input path (e.g., clients/local/...)
if (options.input) {
  const inputPath = path.resolve(options.input);
  const clientMatch = inputPath.match(/clients\/([^\/]+)/);
  if (clientMatch) {
    clientName = clientMatch[1];
  }
}

// Default output: reports/{client}/{test}/enterprise-report-{timestamp}.html
const defaultOutput = path.join('reports', clientName, testName, `enterprise-report-${timestamp}.html`);
const { input, output = defaultOutput, test = testName, client = clientName, 'k6-dashboard': k6Dashboard, 'k6-log': k6Log, 'k6-summary': k6Summary, config: configPath, comparison: comparisonPath } = options;

if (!input && process.stdin.isTTY) {
  console.error('Usage: node bin/report.js --input=<json-file> [--output=<html-file>] [--test=<test-name>] [--client=<client-name>] [--k6-dashboard=<filename>] [--k6-log=<filename>] [--k6-summary=<filename>]');
  console.error('   or: k6 run --out json=- test.js | node bin/report.js [--output=<html-file>] [--test=<test-name>]');
  console.error('');
  console.error('Options:');
  console.error('  --input=<file>        Path to k6 JSON output file');
  console.error('  --output=<file>       Path for generated HTML report (default: reports/{client}/{test}/enterprise-report-{timestamp}.html)');
  console.error('  --test=<name>         Test name for the report');
  console.error('  --client=<name>       Client name for the report');
  console.error('  --k6-dashboard=<file> Filename of k6 web dashboard HTML (for hyperlinking)');
  console.error('  --k6-log=<file>       Filename of k6 execution log (for hyperlinking)');
  console.error('  --k6-summary=<file>   Filename of k6 summary file (for hyperlinking)');
  console.error('  --config=<file>       Path to test configuration JSON file');
  console.error('  --comparison=<file>   Path to comparison markdown file');
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
 * Generate Enterprise HTML report with FAANG styling + Deep Logic
 */
function generateHTML(metrics, checks, testInfo, groupedMetrics, testName, clientName, k6Dashboard, k6Log, k6Summary, screenshots = [], config = null, comparison = null, scenarios = null, comparisonFile = null, metadataFile = null, summaryJsonFile = null, scenarioMetrics = null) {
  // 1. Logic & Calculation Layer
  // ---------------------------
  
  // Calculate Check Statistics
  const checkStats = Object.entries(checks).map(([name, data]) => ({
    name,
    passed: data.passed,
    failed: data.failed,
    total: data.passed + data.failed,
    rate: ((data.passed / (data.passed + data.failed)) * 100).toFixed(2)
  }));

  const totalChecks = checkStats.reduce((sum, c) => sum + c.total, 0);
  const passedChecks = checkStats.reduce((sum, c) => sum + c.passed, 0);
  const failedChecks = totalChecks - passedChecks;
  const overallRate = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(2) : 0;

  // Formatting helpers
  const duration = testInfo.duration ? (testInfo.duration / 1000).toFixed(2) : 'N/A';
  const startTime = testInfo.startTime ? new Date(testInfo.startTime).toLocaleString() : 'N/A';
  const endTime = testInfo.endTime ? new Date(testInfo.endTime).toLocaleString() : 'N/A';
  const reqsPerSec = metrics.http_reqs ? (metrics.http_reqs.values.length / (testInfo.duration / 1000)).toFixed(2) : 0;

  // Chart Data Preparation
  const httpDurationData = metrics.http_req_duration ? calculateStats(metrics.http_req_duration.values) : null;
  const httpWaitingData = metrics.http_req_waiting ? calculateStats(metrics.http_req_waiting.values) : null;

  // SLA / Threshold Definitions (Restored Logic)
  const thresholds = {
    http_req_duration_p95: 500, // Alert if P95 > 500ms
    http_req_error_rate: 1.0    // Alert if Errors > 1%
  };

  // 2. HTML Generation Layer (Modern CSS + Logic Injection)
  // -------------------------------------------------------
  
  // Generate Endpoint Cards with Threshold Logic
  let groupedMetricsHTML = '';
  Object.keys(groupedMetrics).forEach(group => {
    // Solo mostramos grupos que tengan contenido
    const paths = Object.keys(groupedMetrics[group]);
    if (paths.length === 0) return;

    groupedMetricsHTML += `<div class="group-section-title">📂 ${group || 'Default Group'}</div>`;

    paths.forEach(path => {
      const pathMetrics = groupedMetrics[group][path];
      
      // Calculate stats for this specific endpoint
      const durationStats = pathMetrics.http_req_duration ? calculateStats(pathMetrics.http_req_duration.values) : null;
      const failedStats = pathMetrics.http_req_failed ? calculateStats(pathMetrics.http_req_failed.values) : null;
      const reqCount = pathMetrics.http_reqs ? pathMetrics.http_reqs.values.length : 0;
      
      // Calculate specific violations
      const errorRate = failedStats ? (failedStats.avg * 100).toFixed(2) : '0.00';
      const isSlow = durationStats && durationStats.p95 > thresholds.http_req_duration_p95;
      const isErrorProne = parseFloat(errorRate) > thresholds.http_req_error_rate;
      const isViolation = isSlow || isErrorProne;

      // Heuristic for HTTP Method styling
      const method = path.includes('POST') ? 'POST' : path.includes('PUT') ? 'PUT' : path.includes('DELETE') ? 'DEL' : 'GET';
      const cleanPath = path.replace(/^(GET|POST|PUT|DELETE)\s?/, '');

      if (durationStats) {
        groupedMetricsHTML += `
        <div class="group-card ${isViolation ? 'card-violation' : ''}">
          <div class="group-header">
            <div style="display:flex; align-items:center;">
              <span class="path-method">${method}</span>
              <span class="path-url">${cleanPath}</span>
              ${isViolation ? `<span class="badge badge-danger" style="margin-left:10px;">⚠️ SLA Violation</span>` : ''}
            </div>
            <span class="badge" style="background:#F3F4F6; color:var(--text-secondary)">${reqCount} reqs</span>
          </div>
          <div class="mini-stat-grid">
            <div class="mini-stat">
              <div class="label">Avg Duration</div>
              <div class="value">${durationStats.avg.toFixed(2)}ms</div>
            </div>
            <div class="mini-stat">
              <div class="label">P95 Duration</div>
              <div class="value ${isSlow ? 'text-danger' : ''}">
                ${durationStats.p95.toFixed(2)}ms
                ${isSlow ? '<span class="violation-icon">!</span>' : ''}
              </div>
            </div>
            <div class="mini-stat">
              <div class="label">Max Duration</div>
              <div class="value">${durationStats.max.toFixed(2)}ms</div>
            </div>
            <div class="mini-stat">
              <div class="label">Error Rate</div>
              <div class="value ${isErrorProne ? 'text-danger' : 'status-pass'}">${errorRate}%</div>
            </div>
          </div>
        </div>`;
      }
    });
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Report • ${testName}</title>
  
  <!-- Modern Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  
  <style>
    :root {
      /* Enterprise Palette */
      --bg-body: #F9FAFB;
      --bg-card: #FFFFFF;
      --bg-header: #FFFFFF;
      
      --text-primary: #111827;
      --text-secondary: #4B5563;
      --text-tertiary: #9CA3AF;
      
      --border-color: #E5E7EB;
      
      /* Semantic Colors */
      --color-success-bg: #ECFDF5;
      --color-success-text: #059669;
      --color-danger-bg: #FEF2F2;
      --color-danger-text: #DC2626;
      --color-brand: #2563EB; 
      --color-brand-hover: #1D4ED8;
      
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      
      --radius-sm: 6px;
      --radius-md: 8px;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background-color: var(--bg-body);
      color: var(--text-primary);
      font-family: var(--font-sans);
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
      padding-bottom: 60px;
    }

    .wrapper { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

    /* HEADER */
    .top-nav {
      background: var(--bg-header);
      border-bottom: 1px solid var(--border-color);
      padding: 16px 0;
      margin-bottom: 24px;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    
    .nav-content { display: flex; justify-content: space-between; align-items: center; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-logo { width: 32px; height: 32px; background: var(--color-brand); border-radius: var(--radius-sm); display: grid; place-items: center; color: white; font-weight: 700; font-size: 18px; }
    .brand-info h1 { font-size: 16px; font-weight: 600; color: var(--text-primary); line-height: 1.2; }
    .brand-info p { font-size: 12px; color: var(--text-secondary); }

    /* ACTION TOOLBAR */
    .action-toolbar { display: flex; gap: 12px; margin-bottom: 32px; flex-wrap: wrap; }
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 13px; font-weight: 500; border-radius: var(--radius-sm); text-decoration: none; transition: all 0.2s ease; cursor: pointer; height: 36px; border: 1px solid transparent; }
    .btn svg { width: 16px; height: 16px; }
    .btn-primary { background-color: var(--color-brand); color: white; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .btn-primary:hover { background-color: var(--color-brand-hover); transform: translateY(-1px); }
    .btn-outline { background-color: white; color: var(--text-secondary); border-color: var(--border-color); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .btn-outline:hover { background-color: #F3F4F6; border-color: #D1D5DB; color: var(--text-primary); }

    /* KPIS */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
    .kpi-label { font-size: 11px; color: var(--text-secondary); font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-value { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; color: var(--text-primary); }
    .status-pass { color: var(--color-success-text); }
    .status-fail { color: var(--color-danger-text); }

    /* SECTIONS */
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; margin-top: 40px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
    .section-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
    .chart-container { position: relative; height: 320px; width: 100%; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 32px; }

    /* TABLES */
    .table-container { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; margin-bottom: 32px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #F9FAFB; text-align: left; padding: 10px 24px; font-weight: 600; color: var(--text-secondary); border-bottom: 1px solid var(--border-color); font-size: 11px; text-transform: uppercase; }
    td { padding: 14px 24px; border-bottom: 1px solid var(--border-color); color: var(--text-primary); }
    tr:last-child td { border-bottom: none; }
    .mono { font-family: var(--font-mono); }

    /* BADGES & PROGRESS */
    .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .badge-success { background: var(--color-success-bg); color: var(--color-success-text); border: 1px solid #A7F3D0; }
    .badge-danger { background: var(--color-danger-bg); color: var(--color-danger-text); border: 1px solid #FECACA; }
    .progress-bg { width: 100px; height: 6px; background: #F3F4F6; border-radius: 10px; }
    .progress-fill { height: 100%; border-radius: 10px; background: var(--color-success-text); }

    /* ENDPOINT CARDS (Modernized Logic) */
    .group-section-title { font-size: 12px; font-weight: 700; color: var(--text-secondary); margin: 24px 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .group-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 16px; overflow: hidden; transition: all 0.2s ease; }
    
    /* Violation Styling */
    .card-violation { border-left: 4px solid var(--color-danger-text); border-color: #FECACA; background: #FEF2F2; }
    .text-danger { color: var(--color-danger-text) !important; font-weight: 700; }
    .violation-icon { color: var(--color-danger-text); font-weight: bold; margin-left: 4px; }

    .group-header { padding: 12px 20px; background: rgba(248, 250, 252, 0.5); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
    .path-method { font-family: var(--font-mono); font-weight: 700; color: var(--color-brand); font-size: 12px; margin-right: 8px; }
    .path-url { font-size: 13px; font-weight: 500; }
    .mini-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); padding: 16px 20px; gap: 16px; }
    .mini-stat .label { font-size: 10px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 2px; }
    .mini-stat .value { font-size: 14px; font-weight: 600; font-family: var(--font-mono); }
    
    /* SCREENSHOTS */
    .screenshots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; padding: 20px; }
    .screenshot-item img { width: 100%; border-radius: 4px; border: 1px solid var(--border-color); transition: transform 0.2s; }
    .screenshot-item img:hover { transform: scale(1.02); }
    .screenshot-name { font-size: 11px; color: var(--text-secondary); margin-top: 5px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}

    .footer { text-align: center; margin-top: 40px; color: var(--text-tertiary); font-size: 12px; border-top: 1px solid var(--border-color); padding-top: 20px; }
    @media (max-width: 768px) { .mini-stat-grid { grid-template-columns: 1fr 1fr; } }
  </style>
</head>
<body>
  <nav class="top-nav">
    <div class="wrapper nav-content">
      <div class="brand">
        <div class="brand-logo">k6</div>
        <div class="brand-info">
          <h1>${clientName}</h1>
          <p>${testName}</p>
        </div>
      </div>
      <div style="font-size: 12px; color: var(--text-secondary);">${startTime}</div>
    </div>
  </nav>

  <div class="wrapper">
    <!-- ACTION TOOLBAR -->
    <div class="action-toolbar">
      ${k6Dashboard ? `
      <a href="./${k6Dashboard}" target="_blank" class="btn btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg>
        Dashboard
      </a>` : ''}
      ${k6Log ? `
      <a href="./${k6Log}" target="_blank" class="btn btn-outline">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
        Logs
      </a>` : ''}
      ${k6Summary ? `
      <a href="./${k6Summary}" target="_blank" class="btn btn-outline">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
        Summary
      </a>` : ''}
      ${comparisonFile ? `
      <a href="./${comparisonFile}" target="_blank" class="btn btn-outline">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
        Comparison
      </a>` : ''}
      ${metadataFile ? `
      <a href="./${metadataFile}" target="_blank" class="btn btn-outline">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>
        Metadata
      </a>` : ''}
      ${summaryJsonFile ? `
      <a href="./${summaryJsonFile}" target="_blank" class="btn btn-outline">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
        Summary JSON
      </a>` : ''}
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="card">
        <div class="kpi-label">Check Success</div>
        <div class="kpi-value ${overallRate == 100 ? 'status-pass' : overallRate < 95 ? 'status-fail' : ''}">${overallRate}%</div>
        <div style="font-size:12px; color:var(--text-tertiary); margin-top:4px;">${failedChecks} checks failed</div>
      </div>
      <div class="card">
        <div class="kpi-label">Requests / Sec</div>
        <div class="kpi-value">${reqsPerSec}</div>
        <div style="font-size:12px; color:var(--text-tertiary); margin-top:4px;">Total: ${metrics.http_reqs ? metrics.http_reqs.values.length : 0}</div>
      </div>
      <div class="card">
        <div class="kpi-label">P95 Latency</div>
        <div class="kpi-value">${httpDurationData ? httpDurationData.p95.toFixed(2) : 0} <span style="font-size:0.5em;color:var(--text-tertiary)">ms</span></div>
        <div style="font-size:12px; color:var(--text-tertiary); margin-top:4px;">Max: ${httpDurationData ? httpDurationData.max.toFixed(2) : 0}ms</div>
      </div>
      <div class="card">
        <div class="kpi-label">Virtual Users</div>
        <div class="kpi-value">${testInfo.vus}</div>
        <div style="font-size:12px; color:var(--text-tertiary); margin-top:4px;">Iterations: ${testInfo.iterations}</div>
      </div>
    </div>

    <!-- TEST INFO -->
    <div class="section-header">
      <h2 class="section-title">Test Information</h2>
    </div>
    <div class="card" style="margin-bottom: 32px;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
        <div>
          <div class="kpi-label">Start Time</div>
          <div style="font-size: 14px; color: var(--text-primary); margin-top: 4px;">${startTime}</div>
        </div>
        <div>
          <div class="kpi-label">End Time</div>
          <div style="font-size: 14px; color: var(--text-primary); margin-top: 4px;">${endTime}</div>
        </div>
        <div>
          <div class="kpi-label">Duration</div>
          <div style="font-size: 14px; color: var(--text-primary); margin-top: 4px;">${duration}s</div>
        </div>
        <div>
          <div class="kpi-label">Client</div>
          <div style="font-size: 14px; color: var(--text-primary); margin-top: 4px;">${clientName}</div>
        </div>
      </div>
    </div>

    ${scenarios ? `
    <!-- SCENARIOS -->
    <div class="section-header">
      <h2 class="section-title">Test Scenarios</h2>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Executor</th>
            <th>VUs</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(scenarios).map(([name, scenario]) => {
            // Extract VUs based on executor type
            let vusDisplay = 'N/A';
            if (scenario.vus) vusDisplay = scenario.vus;
            else if (scenario.startVUs) vusDisplay = scenario.startVUs;
            else if (scenario.preAllocatedVUs) vusDisplay = `${scenario.preAllocatedVUs}-${scenario.maxVUs || scenario.preAllocatedVUs}`;
            else if (scenario.maxVUs) vusDisplay = `0-${scenario.maxVUs}`;
            
            // Extract duration based on executor type
            let durationDisplay = 'N/A';
            if (scenario.duration) {
              durationDisplay = scenario.duration;
            } else if (scenario.stages && Array.isArray(scenario.stages)) {
              // Calculate total duration from stages
              const totalMs = scenario.stages.reduce((sum, stage) => {
                const duration = stage.duration || '0s';
                const match = duration.match(/(\d+)([smh])/);
                if (match) {
                  const value = parseInt(match[1]);
                  const unit = match[2];
                  if (unit === 's') return sum + value;
                  if (unit === 'm') return sum + value * 60;
                  if (unit === 'h') return sum + value * 3600;
                }
                return sum;
              }, 0);
              if (totalMs >= 60) {
                durationDisplay = `${Math.floor(totalMs / 60)}m ${totalMs % 60}s`;
              } else {
                durationDisplay = `${totalMs}s`;
              }
            }
            
            return `
          <tr>
            <td><strong>${name}</strong></td>
            <td class="mono">${scenario.executor || 'N/A'}</td>
            <td class="mono">${vusDisplay}</td>
            <td class="mono">${durationDisplay}</td>
          </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${config ? `
    <!-- CONFIGURATION -->
    <div class="section-header">
      <h2 class="section-title">Test Configuration</h2>
    </div>
    <div class="card" style="margin-bottom: 32px;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
        ${config.baseUrl ? `
        <div>
          <div class="kpi-label">Base URL</div>
          <div style="font-size: 14px; color: var(--text-primary); margin-top: 4px; font-family: var(--font-mono);">${config.baseUrl}</div>
        </div>
        ` : ''}
        ${config.thresholds ? `
        <div style="grid-column: 1 / -1;">
          <div class="kpi-label">Thresholds</div>
          <div style="margin-top: 8px;">
            ${Object.entries(config.thresholds).map(([metric, conditions]) => `
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary);">${metric}:</span>
                <span style="font-family: var(--font-mono); font-size: 12px; color: var(--text-primary);">${Array.isArray(conditions) ? conditions.join(', ') : conditions}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        ${config.k6Options ? `
        <div style="grid-column: 1 / -1;">
          <div class="kpi-label">k6 Options</div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 8px;">
            ${config.k6Options.summaryMode ? `<div><span style="font-size: 11px; color: var(--text-secondary);">Summary Mode:</span> <span style="font-size: 12px; font-family: var(--font-mono);">${config.k6Options.summaryMode}</span></div>` : ''}
            ${config.k6Options.summaryTimeUnit ? `<div><span style="font-size: 11px; color: var(--text-secondary);">Time Unit:</span> <span style="font-size: 12px; font-family: var(--font-mono);">${config.k6Options.summaryTimeUnit}</span></div>` : ''}
            ${config.k6Options.metricsBackends && config.k6Options.metricsBackends.length > 0 ? `<div><span style="font-size: 11px; color: var(--text-secondary);">Metrics Backends:</span> <span style="font-size: 12px; font-family: var(--font-mono);">${config.k6Options.metricsBackends.map(b => b.type).join(', ')}</span></div>` : ''}
          </div>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${comparison ? `
    <!-- TREND ANALYSIS -->
    <div class="section-header">
      <h2 class="section-title">Performance Trend Analysis</h2>
    </div>
    
    ${(() => {
      // Parse comparison markdown to extract metrics
      const lines = comparison.split('\\n');
      const improvements = [];
      const degradations = [];
      let currentSection = null;
      
      lines.forEach(line => {
        if (line.includes('## Top 3 Improvements')) currentSection = 'improvements';
        else if (line.includes('## Top 3 Degradations')) currentSection = 'degradations';
        else if (line.startsWith('###')) {
          const match = line.match(/### \\d+\\. (.+)/);
          if (match && currentSection) {
            const metric = match[1];
            if (currentSection === 'improvements') improvements.push(metric);
            else degradations.push(metric);
          }
        }
      });
      
      return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-bottom: 24px;">
        ${improvements.length > 0 ? `
        <div class="card" style="border-left: 4px solid var(--color-success-text);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <span style="font-size: 20px;">✅</span>
            <h3 style="font-size: 14px; font-weight: 600; margin: 0;">Top Improvements</h3>
          </div>
          ${improvements.map(metric => `<div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">• ${metric}</div>`).join('')}
        </div>
        ` : ''}
        ${degradations.length > 0 ? `
        <div class="card" style="border-left: 4px solid var(--color-danger-text);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <span style="font-size: 20px;">⚠️</span>
            <h3 style="font-size: 14px; font-weight: 600; margin: 0;">Top Degradations</h3>
          </div>
          ${degradations.map(metric => `<div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">• ${metric}</div>`).join('')}
        </div>
        ` : ''}
      </div>
      
      <div class="card" style="margin-bottom: 32px;">
        <details open>
          <summary style="cursor: pointer; font-weight: 600; padding: 8px 0; user-select: none;">📊 Detailed Comparison</summary>
          <div style="margin-top: 12px;">
            ${(() => {
              // Convert markdown to basic HTML
              let html = comparison
                .replace(/^### (.+)$/gm, '<h4 style="font-size: 14px; font-weight: 600; margin: 16px 0 8px 0; color: var(--text-primary);">$1</h4>')
                .replace(/^## (.+)$/gm, '<h3 style="font-size: 16px; font-weight: 600; margin: 20px 0 12px 0; color: var(--text-primary);">$1</h3>')
                .replace(/^# (.+)$/gm, '<h2 style="font-size: 18px; font-weight: 700; margin: 24px 0 16px 0; color: var(--text-primary);">$1</h2>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/^- (.+)$/gm, '<div style="margin-left: 16px; margin-bottom: 4px;">• $1</div>')
                .replace(/^\|(.+)\|$/gm, (match) => {
                  const cells = match.split('|').filter(c => c.trim());
                  const isHeader = match.includes('---');
                  if (isHeader) return '';
                  const tag = cells[0].trim().match(/^[A-Za-z]/) ? 'th' : 'td';
                  return '<tr>' + cells.map(c => `<${tag} style="padding: 8px; border: 1px solid var(--border-color); text-align: left;">${c.trim()}</${tag}>`).join('') + '</tr>';
                })
                .replace(/(<tr>.*<\/tr>)/s, '<table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px;">$1</table>')
                .split('\n')
                .map(line => line.trim() ? line : '<br>')
                .join('\n');
              return html;
            })()}
          </div>
        </details>
      </div>
      `;
    })()}
    ` : ''}

    <!-- CHART -->
    ${httpDurationData ? `
    <div class="section-header">
      <h2 class="section-title">Response Time Distribution</h2>
    </div>
    <div class="chart-container">
      <canvas id="mainChart"></canvas>
    </div>` : ''}

    <!-- CHECKS TABLE -->
    <div class="section-header">
      <h2 class="section-title">Validation Checks</h2>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 40%">Assertion</th>
            <th style="width: 15%">Result</th>
            <th style="width: 15%">Count</th>
            <th style="width: 30%">Success Rate</th>
          </tr>
        </thead>
        <tbody>
          ${checkStats.map(check => `
          <tr>
            <td><strong>${check.name}</strong></td>
            <td><span class="badge ${check.failed === 0 ? 'badge-success' : 'badge-danger'}">${check.failed === 0 ? 'PASS' : 'FAIL'}</span></td>
            <td class="mono">${check.total}</td>
            <td>
              <div style="display:flex; align-items:center; gap:10px;">
                <div class="progress-bg"><div class="progress-fill" style="width: ${check.rate}%; background: ${check.failed > 0 ? '#DC2626' : 'var(--color-success-text)'}"></div></div>
                <span class="mono">${check.rate}%</span>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- ENDPOINT ANALYSIS (Restored) -->
    <div class="section-header"><h2 class="section-title">Endpoint Analysis</h2></div>
    ${groupedMetricsHTML || '<div style="padding:20px; color:var(--text-secondary)">No grouped metrics found. Ensure your k6 script uses tags.name or tags.group</div>'}

    <!-- METRICS TABLE -->
     <div class="section-header"><h2 class="section-title">Global Metrics</h2></div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Min</th>
            <th>Avg</th>
            <th>P95</th>
            <th>Max</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(metrics)
            .filter(([name]) => !name.startsWith('data_') && name !== 'checks')
            .map(([name, data]) => {
              const stats = calculateStats(data.values);
              if (!stats) return '';
              const isViolation = (name === 'http_req_duration' && stats.p95 > thresholds.http_req_duration_p95);
              return `
              <tr style="${isViolation ? 'background:#FEF2F2' : ''}">
                <td>
                  ${name}
                  ${isViolation ? '<span style="color:#DC2626; font-size:10px; font-weight:bold; margin-left:5px">⚠️ SLOW</span>' : ''}
                </td>
                <td class="mono">${stats.min.toFixed(2)}</td>
                <td class="mono">${stats.avg.toFixed(2)}</td>
                <td class="mono ${isViolation ? 'text-danger' : ''}">${stats.p95.toFixed(2)}</td>
                <td class="mono">${stats.max.toFixed(2)}</td>
              </tr>`;
            }).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- SCREENSHOTS -->
    ${screenshots.length > 0 ? `
    <div class="section-header"><h2 class="section-title">Artifacts & Screenshots</h2></div>
    <div class="card">
      <div class="screenshots-grid">
        ${screenshots.map(shot => `
          <div class="screenshot-item">
            <a href="./${shot}" target="_blank"><img src="./${shot}" loading="lazy" /></a>
            <div class="screenshot-name">${shot}</div>
          </div>
        `).join('')}
      </div>
    </div>` : ''}

    <div class="footer">
      Generated by k6 Enterprise Report • ${new Date().toLocaleString()}
    </div>
  </div>

  <script>
    ${httpDurationData ? `
    const ctx = document.getElementById('mainChart').getContext('2d');
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#6B7280';
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Min', 'Avg', 'Median', 'P90', 'P95', 'P99', 'Max'],
        datasets: [
          {
            label: 'Req Duration',
            data: [${httpDurationData.min}, ${httpDurationData.avg}, ${httpDurationData.median}, ${httpDurationData.p90}, ${httpDurationData.p95}, ${httpDurationData.p99}, ${httpDurationData.max}],
            backgroundColor: '#2563EB', borderRadius: 4, barPercentage: 0.5,
          },
          {
            label: 'TTFB',
            data: [${httpWaitingData ? httpWaitingData.min : 0}, ${httpWaitingData ? httpWaitingData.avg : 0}, ${httpWaitingData ? httpWaitingData.median : 0}, ${httpWaitingData ? httpWaitingData.p90 : 0}, ${httpWaitingData ? httpWaitingData.p95 : 0}, ${httpWaitingData ? httpWaitingData.p99 : 0}, ${httpWaitingData ? httpWaitingData.max : 0}],
            backgroundColor: '#10B981', borderRadius: 4, barPercentage: 0.5, hidden: true
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 6 } },
          tooltip: { backgroundColor: '#111827', padding: 10, cornerRadius: 4, displayColors: false, callbacks: { label: (c) => c.raw.toFixed(2) + ' ms' } }
        },
        scales: {
          y: { grid: { color: '#F3F4F6', drawBorder: false }, beginAtZero: true },
          x: { grid: { display: false } }
        }
      }
    });
    ` : ''}
  </script>
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

  // Scan for screenshots in the output directory
  const reportDir = path.dirname(output);
  let screenshots = [];
  try {
    if (fs.existsSync(reportDir)) {
      const files = fs.readdirSync(reportDir);
      screenshots = files
        .filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))
        .map(file => path.basename(file));
    }
  } catch (e) {
    console.warn('Failed to scan for screenshots:', e);
  }

  // Load configuration file if provided
  let config = null;
  let scenarios = null;
  if (configPath) {
    try {
      const configFullPath = path.resolve(configPath);
      if (fs.existsSync(configFullPath)) {
        config = await fs.readJson(configFullPath);
        scenarios = config.scenarios || null;
        console.log('📝 Loaded configuration from:', configFullPath);
      }
    } catch (e) {
      console.warn('Failed to load config file:', e);
    }
  }

  // Load comparison markdown if provided
  let comparison = null;
  if (comparisonPath) {
    try {
      const comparisonFullPath = path.resolve(comparisonPath);
      if (fs.existsSync(comparisonFullPath)) {
        comparison = await fs.readFile(comparisonFullPath, 'utf-8');
        console.log('📊 Loaded comparison from:', comparisonFullPath);
      }
    } catch (e) {
      console.warn('Failed to load comparison file:', e);
    }
  } else {
    // Try to find the latest comparison file in the report directory
    try {
      if (fs.existsSync(reportDir)) {
        const files = fs.readdirSync(reportDir);
        const comparisonFiles = files
          .filter(file => file.startsWith('comparison-') && file.endsWith('.md'))
          .sort()
          .reverse();
        
        if (comparisonFiles.length > 0) {
          const latestComparison = path.join(reportDir, comparisonFiles[0]);
          comparison = await fs.readFile(latestComparison, 'utf-8');
          console.log('📊 Auto-loaded latest comparison:', comparisonFiles[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to auto-load comparison file:', e);
    }
  }

  // Determine file names for links
  let comparisonFileName = null;
  let metadataFileName = null;
  let summaryJsonFileName = null;

  // Find comparison file
  try {
    if (fs.existsSync(reportDir)) {
      const files = fs.readdirSync(reportDir);
      const comparisonFiles = files
        .filter(file => file.startsWith('comparison-') && file.endsWith('.md'))
        .sort()
        .reverse();
      
      if (comparisonFiles.length > 0) {
        comparisonFileName = comparisonFiles[0];
      }
    }
  } catch (e) {
    console.warn('Failed to find comparison file:', e);
  }

  // Metadata and summary JSON will be created after HTML generation
  const outputPath = path.resolve(output);
  const outputBasename = path.basename(outputPath, '.html');
  metadataFileName = `${outputBasename}_metadata.json`;
  
  // Find summary JSON file
  try {
    if (fs.existsSync(reportDir)) {
      const files = fs.readdirSync(reportDir);
      const summaryFiles = files
        .filter(file => file.startsWith('k6-summary-') && file.endsWith('.json'))
        .sort()
        .reverse();
      
      if (summaryFiles.length > 0) {
        summaryJsonFileName = summaryFiles[0];
      }
    }
  } catch (e) {
    console.warn('Failed to find summary JSON file:', e);
  }

  // Parse k6 text summary for scenario metrics if available
  let scenarioMetrics = null;
  if (k6Summary) {
    try {
      const summaryPath = path.join(reportDir, k6Summary);
      if (fs.existsSync(summaryPath)) {
        const summaryContent = await fs.readFile(summaryPath, 'utf-8');
        console.log('📊 Parsing scenario metrics from summary...');
        
        scenarioMetrics = {};
        const lines = summaryContent.split('\n');
        let currentScenario = null;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Detect scenario header
          if (line.includes('█ SCENARIO:')) {
            currentScenario = line.split('█ SCENARIO:')[1].trim();
            scenarioMetrics[currentScenario] = {};
            continue;
          }
          
          if (currentScenario && scenarioMetrics[currentScenario]) {
            // Parse metrics
            if (line.startsWith('checks_total')) {
              const parts = line.split(':')[1].trim().split(/\s+/);
              scenarioMetrics[currentScenario].checksTotal = parseInt(parts[0]);
            } else if (line.startsWith('checks_succeeded')) {
              const match = line.match(/(\d+) out of (\d+)/);
              if (match) scenarioMetrics[currentScenario].checksPassed = parseInt(match[1]);
            } else if (line.startsWith('checks_failed')) {
              const match = line.match(/(\d+) out of (\d+)/);
              if (match) scenarioMetrics[currentScenario].checksFailed = parseInt(match[1]);
            } else if (line.startsWith('http_reqs')) {
               const parts = line.split(':')[1].trim().split(/\s+/);
               if (parts.length > 1) scenarioMetrics[currentScenario].reqsPerSec = parseFloat(parts[1].replace('/s', ''));
            } else if (line.startsWith('http_req_duration')) {
              const metrics = {};
              const parts = line.split(':')[1].trim().split(/\s+/);
              parts.forEach(p => {
                const [k, v] = p.split('=');
                if (k && v) metrics[k] = parseFloat(v.replace('ms', ''));
              });
              scenarioMetrics[currentScenario].httpReqDuration = metrics;
            } else if (line.startsWith('http_req_failed')) {
               const match = line.match(/(\d+) out of (\d+)/);
               if (match) {
                 scenarioMetrics[currentScenario].httpReqFailed = {
                   fails: parseInt(match[1]),
                   total: parseInt(match[2])
                 };
               }
            }
          }
        }
        
        if (Object.keys(scenarioMetrics).length === 0) {
          scenarioMetrics = null;
        }
      }
    } catch (e) {
      console.warn('Failed to parse scenario metrics:', e);
    }
  }

  const html = generateHTML(metrics, checks, testInfo, groupedMetrics, test, client, k6Dashboard, k6Log, k6Summary, screenshots, config, comparison, scenarios, comparisonFileName, metadataFileName, summaryJsonFileName, scenarioMetrics);
  
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
