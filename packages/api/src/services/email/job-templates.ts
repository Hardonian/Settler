/**
 * Job Notification Email Templates
 * HTML email templates for job failure and completion notifications
 */

/**
 * Job Failure Email Template
 */
export function getJobFailureTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reconciliation Job Failed</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">⚠️ Job Failed</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi there,</p>
        <p>Your reconciliation job <strong>{{jobName}}</strong> has failed.</p>
        <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: 600; color: #991b1b;">Error:</p>
          <p style="margin: 8px 0 0 0; color: #7f1d1d;">{{errorMessage}}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{jobUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Job Details</a>
        </div>
        <p>Need help? <a href="{{supportUrl}}">Contact Support</a> or check our <a href="https://settler.dev/docs">documentation</a>.</p>
        <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">
          Job ID: {{jobId}}<br>
          Result ID: {{resultId}}
        </p>
        <p>Best,<br>The Settler Team</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Job Completion Email Template (with exceptions)
 */
export function getJobCompletionTemplate(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reconciliation Complete - Review Required</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">✅ Job Complete - Review Required</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi there,</p>
        <p>Your reconciliation job <strong>{{jobName}}</strong> has completed successfully.</p>
        <div style="background: #fff7ed; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: 600; color: #92400e;">Summary:</p>
          <ul style="margin: 8px 0 0 0; color: #78350f;">
            <li><strong>{{matchedCount}}</strong> transactions matched</li>
            <li><strong>{{unmatchedCount}}</strong> exceptions require review</li>
            <li>Accuracy: <strong>{{accuracy}}</strong></li>
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{exceptionsUrl}}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Exceptions</a>
          <a href="{{jobUrl}}" style="margin-left: 10px; color: #667eea; text-decoration: none;">View Full Results</a>
        </div>
        <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">
          Job ID: {{jobId}}<br>
          Result ID: {{resultId}}
        </p>
        <p>Best,<br>The Settler Team</p>
      </div>
    </body>
    </html>
  `;
}
