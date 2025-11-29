#!/usr/bin/env node

/**
 * Notification utility for k6 test results
 * Supports Slack, Discord, and Email notifications
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class NotificationService {
  constructor() {
    this.slackWebhook = process.env.SLACK_WEBHOOK_URL;
    this.discordWebhook = process.env.DISCORD_WEBHOOK_URL;
    this.emailConfig = {
      enabled: process.env.EMAIL_ENABLED === 'true',
      smtp: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO
    };
  }

  /**
   * Send notification to Slack
   */
  async sendSlack(message) {
    if (!this.slackWebhook) {
      console.log('⚠️  Slack webhook not configured (SLACK_WEBHOOK_URL)');
      return;
    }

    const payload = {
      text: message.title,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: message.title,
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Client:*\n${message.client}`
            },
            {
              type: 'mrkdwn',
              text: `*Test:*\n${message.test}`
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\n${message.status}`
            },
            {
              type: 'mrkdwn',
              text: `*Duration:*\n${message.duration}`
            }
          ]
        }
      ]
    };

    if (message.metrics) {
      payload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Metrics:*\n${message.metrics}`
        }
      });
    }

    if (message.errors && message.errors.length > 0) {
      payload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Errors:*\n${message.errors.join('\n')}`
        }
      });
    }

    await this.sendWebhook(this.slackWebhook, payload);
    console.log('✅ Slack notification sent');
  }

  /**
   * Send notification to Discord
   */
  async sendDiscord(message) {
    if (!this.discordWebhook) {
      console.log('⚠️  Discord webhook not configured (DISCORD_WEBHOOK_URL)');
      return;
    }

    const color = message.status === 'PASSED' ? 0x00ff00 : 0xff0000;
    const payload = {
      embeds: [
        {
          title: message.title,
          color: color,
          fields: [
            { name: 'Client', value: message.client, inline: true },
            { name: 'Test', value: message.test, inline: true },
            { name: 'Status', value: message.status, inline: true },
            { name: 'Duration', value: message.duration, inline: true }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    if (message.metrics) {
      payload.embeds[0].fields.push({
        name: 'Metrics',
        value: message.metrics,
        inline: false
      });
    }

    if (message.errors && message.errors.length > 0) {
      payload.embeds[0].fields.push({
        name: 'Errors',
        value: message.errors.join('\n'),
        inline: false
      });
    }

    await this.sendWebhook(this.discordWebhook, payload);
    console.log('✅ Discord notification sent');
  }

  /**
   * Send webhook request
   */
  async sendWebhook(webhookUrl, payload) {
    return new Promise((resolve, reject) => {
      const url = new URL(webhookUrl);
      const protocol = url.protocol === 'https:' ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`Webhook failed with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  /**
   * Send all configured notifications
   */
  async sendAll(message) {
    const promises = [];

    if (this.slackWebhook) {
      promises.push(this.sendSlack(message).catch(err => {
        console.error('Slack notification failed:', err.message);
      }));
    }

    if (this.discordWebhook) {
      promises.push(this.sendDiscord(message).catch(err => {
        console.error('Discord notification failed:', err.message);
      }));
    }

    await Promise.all(promises);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node bin/notify.js [options]

Options:
  --title <text>      Notification title (required)
  --client <name>     Client name (required)
  --test <name>       Test name (required)
  --status <status>   Test status (PASSED/FAILED) (required)
  --duration <time>   Test duration
  --metrics <text>    Metrics summary
  --error <text>      Error message (can be used multiple times)
  --slack             Send to Slack only
  --discord           Send to Discord only

Environment Variables:
  SLACK_WEBHOOK_URL   Slack webhook URL
  DISCORD_WEBHOOK_URL Discord webhook URL

Example:
  node bin/notify.js \\
    --title "Load Test Completed" \\
    --client "examples" \\
    --test "ecommerce-flow.ts" \\
    --status "PASSED" \\
    --duration "5m" \\
    --metrics "p95: 245ms, Error Rate: 0.1%"
    `);
    process.exit(0);
  }

  const message = {
    title: '',
    client: '',
    test: '',
    status: '',
    duration: '',
    metrics: '',
    errors: []
  };

  let slackOnly = false;
  let discordOnly = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--title':
        message.title = args[++i];
        break;
      case '--client':
        message.client = args[++i];
        break;
      case '--test':
        message.test = args[++i];
        break;
      case '--status':
        message.status = args[++i];
        break;
      case '--duration':
        message.duration = args[++i];
        break;
      case '--metrics':
        message.metrics = args[++i];
        break;
      case '--error':
        message.errors.push(args[++i]);
        break;
      case '--slack':
        slackOnly = true;
        break;
      case '--discord':
        discordOnly = true;
        break;
    }
  }

  const service = new NotificationService();

  if (slackOnly) {
    service.sendSlack(message).catch(err => {
      console.error('Failed to send notification:', err.message);
      process.exit(1);
    });
  } else if (discordOnly) {
    service.sendDiscord(message).catch(err => {
      console.error('Failed to send notification:', err.message);
      process.exit(1);
    });
  } else {
    service.sendAll(message).catch(err => {
      console.error('Failed to send notifications:', err.message);
      process.exit(1);
    });
  }
}

module.exports = { NotificationService };
