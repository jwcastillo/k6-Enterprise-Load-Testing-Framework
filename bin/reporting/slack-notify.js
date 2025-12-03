#!/usr/bin/env node

/**
 * slack-notify.js - Send test results to Slack
 * 
 * Usage:
 *   node bin/reporting/slack-notify.js --webhook=<url> --client=<name> --test=<name> --report-dir=<path>
 * 
 * Environment Variables:
 *   SLACK_WEBHOOK_URL - Slack webhook URL (can be used instead of --webhook)
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
  const [key, value] = arg.split('=');
  options[key.replace('--', '')] = value;
});

const { 
  webhook = process.env.SLACK_WEBHOOK_URL, 
  client, 
  test, 
  'report-dir': reportDir 
} = options;

if (!webhook) {
  console.error('Error: Slack webhook URL is required');
  console.error('Usage: node bin/reporting/slack-notify.js --webhook=<url> --client=<name> --test=<name> --report-dir=<path>');
  console.error('   or: Set SLACK_WEBHOOK_URL environment variable');
  process.exit(1);
}

if (!reportDir || !client || !test) {
  console.error('Error: --client, --test, and --report-dir are required');
  process.exit(1);
}

/**
 * Send message to Slack
 */
async function sendToSlack(payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(webhook);
    const data = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(responseData);
        } else {
          reject(new Error(`Slack API returned ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('📊 Preparing Slack notification...');
    console.log(`   Client: ${client}`);
    console.log(`   Test: ${test}`);
    console.log(`   Report Dir: ${reportDir}`);

    // Find all generated files
    const files = fs.readdirSync(reportDir);
    
    const enterpriseReport = files.find(f => f.startsWith('enterprise-report-') && f.endsWith('.html'));
    const k6Dashboard = files.find(f => f.startsWith('k6-dashboard-') && f.endsWith('.html'));
    const k6Summary = files.find(f => f.startsWith('k6-summary-') && f.endsWith('.txt'));
    const k6SummaryJson = files.find(f => f.startsWith('k6-summary-') && f.endsWith('.json'));
    const k6Log = files.find(f => f.startsWith('k6-execution-') && f.endsWith('.log'));
    const metadata = files.find(f => f.includes('_metadata.json'));
    const comparison = files.find(f => f.startsWith('comparison-') && f.endsWith('.md'));

    // Load metadata for summary
    let testSummary = {
      duration: 'N/A',
      checks: 'N/A',
      iterations: 'N/A',
      vus: 'N/A'
    };

    if (metadata) {
      try {
        const metadataContent = await fs.readJson(path.join(reportDir, metadata));
        testSummary = {
          duration: metadataContent.testInfo?.duration ? `${(metadataContent.testInfo.duration / 1000).toFixed(2)}s` : 'N/A',
          checks: `${metadataContent.summary?.passedChecks || 0}/${metadataContent.summary?.totalChecks || 0} passed`,
          iterations: metadataContent.testInfo?.iterations || 'N/A',
          vus: metadataContent.testInfo?.vus || 'N/A'
        };
      } catch (e) {
        console.warn('Failed to load metadata:', e);
      }
    }

    // Determine test status
    const checksPassed = testSummary.checks.includes('/');
    const [passed, total] = testSummary.checks.split('/').map(n => parseInt(n.trim()));
    const passRate = total > 0 ? (passed / total) * 100 : 0;
    
    let statusEmoji = '✅';
    let statusColor = '#36a64f'; // green
    let statusText = 'PASSED';
    
    if (passRate < 100) {
      statusEmoji = '⚠️';
      statusColor = '#ff9900'; // orange
      statusText = 'PASSED WITH WARNINGS';
    }
    
    if (passRate < 95) {
      statusEmoji = '❌';
      statusColor = '#ff0000'; // red
      statusText = 'FAILED';
    }

    // Build file list
    const fileList = [];
    const fileMap = {
      'Enterprise Report': enterpriseReport,
      'k6 Dashboard': k6Dashboard,
      'Summary': k6Summary,
      'Summary JSON': k6SummaryJson,
      'Execution Log': k6Log,
      'Metadata': metadata,
      'Comparison': comparison
    };

    for (const [name, file] of Object.entries(fileMap)) {
      if (file) {
        const filePath = path.join(reportDir, file);
        const stats = fs.statSync(filePath);
        fileList.push({
          name,
          file,
          size: formatFileSize(stats.size)
        });
      }
    }

    // Build Slack message
    const message = {
      text: `${statusEmoji} Load Test Results: ${client} / ${test}`,
      attachments: [
        {
          color: statusColor,
          title: `${statusEmoji} ${statusText}`,
          fields: [
            {
              title: 'Client',
              value: client,
              short: true
            },
            {
              title: 'Test',
              value: test,
              short: true
            },
            {
              title: 'Duration',
              value: testSummary.duration,
              short: true
            },
            {
              title: 'Checks',
              value: testSummary.checks,
              short: true
            },
            {
              title: 'Iterations',
              value: testSummary.iterations.toString(),
              short: true
            },
            {
              title: 'Max VUs',
              value: testSummary.vus.toString(),
              short: true
            }
          ],
          footer: 'k6 Enterprise Framework',
          ts: Math.floor(Date.now() / 1000)
        },
        {
          color: '#36a64f',
          title: '📁 Generated Files',
          text: fileList.map(f => `• *${f.name}*: \`${f.file}\` (${f.size})`).join('\\n'),
          footer: `Total: ${fileList.length} files`
        }
      ]
    };

    // Send to Slack
    console.log('\\n📤 Sending notification to Slack...');
    await sendToSlack(message);
    
    console.log('✅ Notification sent successfully!');
    console.log(`   Status: ${statusText}`);
    console.log(`   Files: ${fileList.length}`);
    
  } catch (error) {
    console.error('❌ Error sending Slack notification:', error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
