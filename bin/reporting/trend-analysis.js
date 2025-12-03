#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

export class TrendAnalyzer {
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
      http_req_duration_p95: metrics.http_req_duration?.p95 || 0,
      http_req_duration_avg: metrics.http_req_duration?.avg || 0,
      http_reqs_rate: metrics.http_reqs?.rate || 0,
      http_req_failed_rate: (metrics.http_req_failed?.rate || 0) * 100,
      vus_max: metrics.vus_max?.max || 0,
      iterations: metrics.iterations?.count || 0
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