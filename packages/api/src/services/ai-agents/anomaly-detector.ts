/**
 * Anomaly & Exploit Detector Agent
 * 
 * Detects anomalies in reconciliation data, API usage patterns, and security threats.
 */

import { BaseAgent } from './orchestrator';
import { logInfo, logError } from '../../utils/logger';

export interface Anomaly {
  id: string;
  type: 'reconciliation' | 'security' | 'data_quality' | 'business_logic';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title?: string;
  description: string;
  detectedAt: Date;
  evidence?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  confidence: number; // 0-100
  recommendedAction?: string;
}

export class AnomalyDetectorAgent extends BaseAgent {
  id = 'anomaly-detector';
  name = 'Anomaly & Exploit Detector';
  type = 'anomaly' as const;

  private detectedAnomalies: Anomaly[] = [];
  private lastDetection?: Date;
  // Reserved for future rule-based detection
  private _detectionRules: DetectionRule[] = [];

  async initialize(): Promise<void> {
    // Load detection rules
    this._detectionRules = await this.loadDetectionRules();
    void this._detectionRules;

    // Start periodic anomaly detection
    setInterval(() => {
      if (this.enabled) {
        this.detectAnomalies().catch(error => {
          logError('Anomaly detection failed', error);
        });
      }
    }, 60000); // Every minute

    this.enabled = true;
  }

  async execute(action: string, params: Record<string, unknown>): Promise<unknown> {
    switch (action) {
      case 'detect':
        return await this.detectAnomalies();
      
      case 'get_anomalies':
        return this.detectedAnomalies.filter(a => {
          if (params.severity) return a.severity === params.severity;
          if (params.type) return a.type === params.type;
          return true;
        });
      
      case 'get_stats':
        return await this.getStatus();
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async getStatus(): Promise<{
    enabled: boolean;
    lastExecution?: Date;
    metrics?: Record<string, unknown>;
  }> {
    const status: {
      enabled: boolean;
      lastExecution?: Date;
      metrics?: Record<string, unknown>;
    } = {
      enabled: this.enabled,
    };
    if (this.lastDetection) {
      status.lastExecution = this.lastDetection;
    }
    status.metrics = {
      totalAnomalies: this.detectedAnomalies.length,
      criticalAnomalies: this.detectedAnomalies.filter(a => a.severity === 'critical').length,
      falsePositiveRate: 0.05, // TODO: Calculate actual rate
    };
    return status;
  }

  /**
   * Detect anomalies
   */
  private async detectAnomalies(): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // Check reconciliation anomalies
    const reconciliationAnomalies = await this.detectReconciliationAnomalies();
    anomalies.push(...reconciliationAnomalies);

    // Check security threats
    const securityThreats = await this.detectSecurityThreats();
    anomalies.push(...securityThreats);

    // Check data quality issues
    const dataQualityIssues = await this.detectDataQualityIssues();
    anomalies.push(...dataQualityIssues);

    // Check business logic anomalies
    const businessLogicAnomalies = await this.detectBusinessLogicAnomalies();
    anomalies.push(...businessLogicAnomalies);

    this.detectedAnomalies.push(...anomalies);
    this.lastDetection = new Date();

    // Alert on critical/high severity anomalies
    for (const anomaly of anomalies) {
      if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
        this.emit('anomaly_detected', anomaly);
        await this.sendAlert(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Detect reconciliation anomalies
   */
  private async detectReconciliationAnomalies(): Promise<Anomaly[]> {
    // TODO: Query database for reconciliation patterns
    // Check for sudden drops in accuracy, unusual matching patterns, etc.
    
    return [
      {
        id: 'anom_recon_1',
        type: 'reconciliation' as const,
        severity: 'high' as const,
        description: 'Sudden drop in reconciliation accuracy detected',
        detectedAt: new Date(),
        evidence: {
          previousAccuracy: 0.98,
          currentAccuracy: 0.85,
          dropPercentage: 13.3,
          jobId: 'job_123',
        },
        confidence: 85,
        recommendedAction: 'Review matching rules and data quality',
      },
    ];
  }

  /**
   * Detect security threats
   */
  private async detectSecurityThreats(): Promise<Anomaly[]> {
    const threats: Anomaly[] = [];

    try {
      // Analyze API logs for security threats
      // Check for API abuse, credential leaks, DDoS attacks, etc.
      
      // Query recent API logs for suspicious patterns
      // Note: UsageEvent table may not have all API logs - this is a simplified check
      // Import PrismaClient dynamically to avoid circular dependencies
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const recentLogs = await prisma.usageEvent.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        select: {
          id: true,
          eventType: true,
          metadata: true,
          tenantId: true,
          userId: true,
          timestamp: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 1000,
      });

      // Check for rate limit violations (potential DDoS)
      const rateLimitViolations = recentLogs.filter((log: { tenantId: string | null }) => {
        const sameTenant = recentLogs.filter((l: { tenantId: string | null }) => l.tenantId === log.tenantId);
        return sameTenant.length > 1000; // More than 1000 requests in 24h
      });

      if (rateLimitViolations.length > 0) {
        threats.push({
          id: `security-rate-limit-${Date.now()}`,
          type: 'security',
          severity: 'high',
          title: 'Potential DDoS Attack Detected',
          description: `Tenant ${rateLimitViolations[0]?.tenantId || 'unknown'} has exceeded rate limits`,
          detectedAt: new Date(),
          metadata: {
            tenantId: rateLimitViolations[0]?.tenantId,
            requestCount: rateLimitViolations.length,
          },
          confidence: 75,
        });
      }

      // Check for authentication failures (potential brute force)
      const authFailures = recentLogs.filter((log: { eventType?: string | null }) => 
        log.eventType?.includes('auth_failed') || log.eventType?.includes('login_failed')
      );

      if (authFailures.length > 50) {
        threats.push({
          id: `security-auth-failures-${Date.now()}`,
          type: 'security',
          severity: 'medium',
          title: 'Excessive Authentication Failures',
          description: `${authFailures.length} authentication failures detected in last 24 hours`,
          detectedAt: new Date(),
          metadata: {
            failureCount: authFailures.length,
          },
          confidence: 80,
        });
      }

      // Check metadata for potential credential leaks
      const potentialLeaks = recentLogs.filter((log: { metadata?: unknown }) => {
        const metadataStr = JSON.stringify(log.metadata || {});
        return metadataStr.includes('password') || 
               metadataStr.includes('api_key') || 
               metadataStr.includes('secret') ||
               metadataStr.includes('token');
      });

      if (potentialLeaks.length > 0) {
        threats.push({
          id: `security-credential-leak-${Date.now()}`,
          type: 'security',
          severity: 'critical',
          title: 'Potential Credential Leak Detected',
          description: 'API logs contain potential sensitive credentials',
          detectedAt: new Date(),
          metadata: {
            leakCount: potentialLeaks.length,
          },
          confidence: 90,
        });
      }

      logInfo('Security threat detection completed', {
        threatCount: threats.length,
        rateLimitViolations: rateLimitViolations.length,
        authFailures: authFailures.length,
        potentialLeaks: potentialLeaks.length,
      });
      
      await prisma.$disconnect();
    } catch (error) {
      logError('Failed to detect security threats', error);
    }

    return threats;
  }

  /**
   * Detect data quality issues
   */
  private async detectDataQualityIssues(): Promise<Anomaly[]> {
    // TODO: Analyze data for quality issues
    // Check for missing data, format changes, inconsistencies, etc.
    
    return [];
  }

  /**
   * Detect business logic anomalies
   */
  private async detectBusinessLogicAnomalies(): Promise<Anomaly[]> {
    // TODO: Analyze business logic patterns
    // Check for unusual customer behavior, potential fraud, compliance violations, etc.
    
    return [];
  }

  /**
   * Load detection rules
   */
  private async loadDetectionRules(): Promise<DetectionRule[]> {
    // TODO: Load from database or config
    return [
      {
        id: 'rule_1',
        type: 'reconciliation',
        condition: 'accuracy < 0.9',
        severity: 'high',
      },
      {
        id: 'rule_2',
        type: 'security',
        condition: 'api_calls_per_minute > 1000',
        severity: 'medium',
      },
    ];
  }

  /**
   * Send alert for anomaly
   */
  private async sendAlert(anomaly: Anomaly): Promise<void> {
    // TODO: Send to alerting system (PagerDuty, Slack, etc.)
    console.log(`ALERT: ${anomaly.severity.toUpperCase()} - ${anomaly.description}`);
    this.emit('alert_sent', anomaly);
  }
}

interface DetectionRule {
  id: string;
  type: string;
  condition: string;
  severity: Anomaly['severity'];
}
