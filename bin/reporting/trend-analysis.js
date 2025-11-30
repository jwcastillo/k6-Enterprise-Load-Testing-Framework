#!/usr/bin/env node

/**
 * Trend Analysis Tool
 * Compares multiple k6 test runs to identify performance trends
 */

const fs = require('fs');
const path = require('path');

class TrendAnalyzer {
  constructor(reportPaths) {
    this.reports = reportPaths.map(p => this.loadReport(p));
  }

  loadReport(reportPath) {
    try {
      const content = fs.readFileSync(reportPath, 'utf8');
      const data = JSON.parse(content);
      return {
        path: reportPath,
        timestamp: fs.statSync(reportPath).mtime,
        metrics: data.metrics
      };
    } catch (error) {
      console.error(`Failed to load report ${reportPath}:`, error.message);
      return null;
    }
  }

  /**
   * Extract key metrics from a report
   */
  extractMetrics(report) {
    if (!report || !report.metrics) return null;

    const metrics = report.metrics;
    return {
      timestamp: report.timestamp,
      http_req_duration_p95: metrics.http_req_duration?.values?.['p(95)'] || 0,
      http_req_duration_avg: metrics.http_req_duration?.values?.avg || 0,
      http_reqs_rate: metrics.http_reqs?.values?.rate || 0,
      http_req_failed_rate: (metrics.http_req_failed?.values?.rate || 0) * 100,
      vus_max: metrics.vus_max?.values?.value || 0,
      iterations: metrics.iterations?.values?.count || 0
    };
  }

  /**
   * Calculate trend (improving/degrading/stable)
   */
  calculateTrend(values) {
    if (values.length < 2) return 'insufficient_data';

    const recent = values.slice(-3); // Last 3 values
    const older = values.slice(0, -3);

    if (older.length === 0) return 'insufficient_data';

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'degrading' : 'improving';
  }

  /**
   * Generate trend report
   */
  generateReport() {
    const validReports = this.reports.filter(r => r !== null);
    
    if (validReports.length < 2) {
      return {
        error: 'Need at least 2 valid reports for trend analysis',
        count: validReports.length
      };
    }

    // Sort by timestamp
    validReports.sort((a, b) => a.timestamp - b.timestamp);

    const metricsOverTime = validReports.map(r => this.extractMetrics(r));

    // Calculate trends for each metric
    const trends = {
      http_req_duration_p95: {
        values: metricsOverTime.map(m => m.http_req_duration_p95),
        trend: this.calculateTrend(metricsOverTime.map(m => m.http_req_duration_p95)),
        unit: 'ms',
        lowerIsBetter: true
      },
      http_req_duration_avg: {
        values: metricsOverTime.map(m => m.http_req_duration_avg),
        trend: this.calculateTrend(metricsOverTime.map(m => m.http_req_duration_avg)),
        unit: 'ms',
        lowerIsBetter: true
      },
      http_reqs_rate: {
        values: metricsOverTime.map(m => m.http_reqs_rate),
        trend: this.calculateTrend(metricsOverTime.map(m => -m.http_reqs_rate)), // Invert for "higher is better"
        unit: 'req/s',
        lowerIsBetter: false
      },
      http_req_failed_rate: {
        values: metricsOverTime.map(m => m.http_req_failed_rate),
        trend: this.calculateTrend(metricsOverTime.map(m => m.http_req_failed_rate)),
        unit: '%',
        lowerIsBetter: true
      }
    };

    return {
      reportCount: validReports.length,
      timeRange: {
        start: validReports[0].timestamp,
        end: validReports[validReports.length - 1].timestamp
      },
      trends,
      metricsOverTime
    };
  }

  /**
   * Generate markdown report
   */
  generateMarkdown() {
    const report = this.generateReport();

    if (report.error) {
      return `# Trend Analysis Report\n\n❌ ${report.error}\n\nReports found: ${report.count}`;
    }

    const trendEmoji = (trend, lowerIsBetter) => {
      if (trend === 'insufficient_data') return '⚠️';
      if (trend === 'stable') return '➡️';
      if (trend === 'improving') return lowerIsBetter ? '📉' : '📈';
      if (trend === 'degrading') return lowerIsBetter ? '📈' : '📉';
      return '❓';
    };

    let md = `# Trend Analysis Report\n\n`;
    md += `**Reports Analyzed**: ${report.reportCount}\n`;
    md += `**Time Range**: ${report.timeRange.start.toISOString()} → ${report.timeRange.end.toISOString()}\n\n`;

    md += `## Trends Summary\n\n`;
    md += `| Metric | Trend | Latest Value | Status |\n`;
    md += `|--------|-------|--------------|--------|\n`;

    for (const [key, data] of Object.entries(report.trends)) {
      const latest = data.values[data.values.length - 1];
      const emoji = trendEmoji(data.trend, data.lowerIsBetter);
      const metricName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      md += `| ${metricName} | ${emoji} ${data.trend} | ${latest.toFixed(2)} ${data.unit} | `;
      
      if (data.trend === 'improving') {
        md += `✅ Good |\n`;
      } else if (data.trend === 'degrading') {
        md += `⚠️ Needs Attention |\n`;
      } else {
        md += `➡️ Stable |\n`;
      }
    }

    md += `\n## Detailed Metrics\n\n`;

    for (const [key, data] of Object.entries(report.trends)) {
      const metricName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      md += `### ${metricName}\n\n`;
      md += `| Run | Value |\n`;
      md += `|-----|-------|\n`;
      data.values.forEach((val, idx) => {
        md += `| ${idx + 1} | ${val.toFixed(2)} ${data.unit} |\n`;
      });
      md += `\n`;
    }

    return md;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: node bin/trend-analysis.js <report1.json> <report2.json> [report3.json ...]

Or use glob pattern:
  node bin/trend-analysis.js reports/*/k6-summary-*.json

Options:
  --output <file>     Save markdown report to file
  --json              Output as JSON instead of markdown

Example:
  node bin/trend-analysis.js \\
    reports/local/test1/k6-summary-*.json \\
    reports/local/test2/k6-summary-*.json \\
    --output trend-report.md
    `);
    process.exit(0);
  }

  let outputFile = null;
  let jsonOutput = false;
  const reportPaths = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output') {
      outputFile = args[++i];
    } else if (args[i] === '--json') {
      jsonOutput = true;
    } else {
      reportPaths.push(args[i]);
    }
  }

  const analyzer = new TrendAnalyzer(reportPaths);
  
  if (jsonOutput) {
    const report = analyzer.generateReport();
    const output = JSON.stringify(report, null, 2);
    
    if (outputFile) {
      fs.writeFileSync(outputFile, output);
      console.log(`✅ JSON report saved to ${outputFile}`);
    } else {
      console.log(output);
    }
  } else {
    const markdown = analyzer.generateMarkdown();
    
    if (outputFile) {
      fs.writeFileSync(outputFile, markdown);
      console.log(`✅ Markdown report saved to ${outputFile}`);
    } else {
      console.log(markdown);
    }
  }
}

module.exports = { TrendAnalyzer };
