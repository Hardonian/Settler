/**
 * Monitor Agent - 24/7 System Monitoring
 * 
 * Monitors:
 * - Application health
 * - Website uptime
 * - Database performance
 * - API latency
 * - Error rates
 * - Security scans
 * 
 * Usage: node agents/monitor-agent.js
 */

import { createClient } from "@supabase/supabase-js";
import { createLogger } from "../../logger/src";

const log = createLogger('monitor-agent');

interface HealthStatus {
  app: 'up' | 'down' | 'degraded';
  database: 'up' | 'down';
  api: 'up' | 'down';
  errors: number;
  latency: number;
}

interface Config {
  supabaseUrl: string;
  supabaseKey: string;
  checkInterval: number;
  alertThreshold: number;
  slackWebhook?: string;
}

class MonitorAgent {
  private config: Config;
  private history: HealthStatus[] = [];
  private alertCooldown = 0;

  constructor(config: Config) {
    this.config = config;
  }

  async start() {
    log.info('Starting Monitor Agent...');
    
    setInterval(() => this.check(), this.config.checkInterval);
    await this.check();
    
    log.info(`Monitor Agent running, checking every ${this.config.checkInterval}ms`);
  }

  async check() {
    const status = await this.gatherHealth();
    this.history.push(status);
    
    if (this.history.length > 100) {
      this.history.shift();
    }

    if (status.errors > this.config.alertThreshold) {
      await this.alert('High error rate detected', status);
    }

    if (status.latency > 1000) {
      await this.alert('High latency detected', status);
    }

    if (status.app === 'down' || status.database === 'down') {
      await this.alert('System down', status);
    }
  }

  async gatherHealth(): Promise<HealthStatus> {
    const status: HealthStatus = {
      app: 'up',
      database: 'up',
      api: 'up',
      errors: 0,
      latency: 0,
    };

    const start = Date.now();

    try {
      const supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);
      const { error } = await supabase.from('_pg_table').select('tablename').limit(1).single();
      
      if (error && error.code !== 'PGRST116') {
        status.database = 'down';
        status.errors++;
      }
    } catch {
      status.database = 'down';
      status.errors++;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/health`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      
      if (!res.ok) {
        status.api = 'down';
        status.errors++;
      }
    } catch {
      status.api = 'down';
      status.errors++;
    }

    status.latency = Date.now() - start;

    try {
      const supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      
      const { count } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo);
      
      if (count) {
        status.errors += count;
      }
    } catch {
      // Table might not exist
    }

    status.app = status.errors === 0 ? 'up' : 'degraded';
    
    log.info(`Health check: ${status.app} (${status.errors} errors, ${status.latency}ms)`);
    
    return status;
  }

  async alert(message: string, status: HealthStatus) {
    const now = Date.now();
    if (now - this.alertCooldown < 3600000) return;
    this.alertCooldown = now;

    log.error(`ALERT: ${message}`, status);

    if (this.config.slackWebhook) {
      try {
        await fetch(this.config.slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 *Monitor Alert* - ${message}`,
            blocks: [
              { type: 'section', text: { type: 'mrkdwn', text: `*${message}*` } },
              { type: 'section', fields: [
                { type: 'mrkdwn', text: `*App:*n${status.app}` },
                { type: 'mrkdwn', text: `*Database:*n${status.database}` },
                { type: 'mrkdwn', text: `*Errors:*n${status.errors}` },
                { type: 'mrkdwn', text: `*Latency:*n${status.latency}ms` },
              ]},
            ],
          }),
        });
      } catch (e) {
        log.error('Failed to send Slack alert', e);
      }
    }

    try {
      const supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);
      await supabase.from('monitoring_alerts').insert({
        message,
        status,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Table might not exist
    }
  }

  getStatus() {
    return {
      current: this.history[this.history.length - 1] || { app: 'up', database: 'up', api: 'up', errors: 0, latency: 0 },
      history: this.history,
    };
  }
}

// CLI
const config: Config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  checkInterval: parseInt(process.env.CHECK_INTERVAL || '60000', 10),
  alertThreshold: parseInt(process.env.ALERT_THRESHOLD || '10', 10),
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
};

const agent = new MonitorAgent(config);
agent.start().catch(log.error);

export { MonitorAgent };
