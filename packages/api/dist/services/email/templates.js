"use strict";
/**
 * Email Templates
 * HTML email templates for lifecycle sequences
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDay7SuccessTemplate = getDay7SuccessTemplate;
exports.getDay7ReminderTemplate = getDay7ReminderTemplate;
exports.getDay14ProgressTemplate = getDay14ProgressTemplate;
exports.getDay21FeatureTemplate = getDay21FeatureTemplate;
exports.getDay27ExpirationTemplate = getDay27ExpirationTemplate;
exports.getDay29FinalTemplate = getDay29FinalTemplate;
exports.getDay30TrialEndedTemplate = getDay30TrialEndedTemplate;
function getDay7SuccessTemplate() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're making great progress!</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">🎉 Great Progress!</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi {{name}},</p>
        <p>You've completed your first reconciliation job! That's a huge step forward.</p>
        <p>Here's what you can do next:</p>
        <ul>
          <li>Run your first reconciliation to see results</li>
          <li>Set up webhooks for real-time updates</li>
          <li>Export your reports</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboardUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Continue to Dashboard</a>
        </div>
        <p>Need help? Reply to this email or check out our <a href="https://settler.dev/docs">documentation</a>.</p>
        <p>Best,<br>The Settler Team</p>
      </div>
    </body>
    </html>
  `;
}
function getDay7ReminderTemplate() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Let's get you started with Settler</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Let's Get Started</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi {{name}},</p>
        <p>You signed up for Settler a week ago, but we noticed you haven't created your first job yet.</p>
        <p>Getting started is easy:</p>
        <ol>
          <li>Create your first reconciliation job</li>
          <li>Run it to see results</li>
          <li>Export your reports</li>
        </ol>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboardUrl}}/playground" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Create Your First Job</a>
        </div>
        <p>Need help? Check out our <a href="https://settler.dev/docs/getting-started">getting started guide</a>.</p>
        <p>Best,<br>The Settler Team</p>
      </div>
    </body>
    </html>
  `;
}
function getDay14ProgressTemplate() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Progress Update</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Progress Update</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi {{name}},</p>
        <p>You've been using Settler for 2 weeks! Here's your progress:</p>
        <ul>
          <li>Onboarding: {{completionPercentage}}% complete</li>
          <li>Reconciliations run: {{reconciliations}}</li>
        </ul>
        <p>You have {{daysRemaining}} days left in your trial. Make the most of it!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboardUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a>
        </div>
        <p>Best,<br>The Settler Team</p>
      </div>
    </body>
    </html>
  `;
}
function getDay21FeatureTemplate() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Explore Advanced Features</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Explore Advanced Features</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi {{name}},</p>
        <p>You've been using Settler for 3 weeks! Ready to explore more?</p>
        <p>Here are some advanced features you might not have tried yet:</p>
        <ul>
          <li><strong>Event-driven Webhooks:</strong> Get real-time updates when reconciliations complete</li>
          <li><strong>Custom Matching Rules:</strong> Fine-tune how transactions are matched</li>
          <li><strong>Multi-Currency Support:</strong> Reconcile transactions across different currencies</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboardUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Explore Features</a>
        </div>
        <p>You have {{daysRemaining}} days left in your trial.</p>
        <p>Best,<br>The Settler Team</p>
      </div>
    </body>
    </html>
  `;
}
function getDay27ExpirationTemplate() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Trial Ends Soon</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">⏰ Trial Ending Soon</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi {{name}},</p>
        <p><strong>Your trial ends in 3 days!</strong></p>
        <p>You've run {{reconciliations}} reconciliations so far. Don't lose access to your workflows.</p>
        <p>Upgrade now to keep:</p>
        <ul>
          <li>Unlimited reconciliations</li>
          <li>All your existing jobs and data</li>
          <li>Priority email support</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{upgradeUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Upgrade to Commercial</a>
        </div>
        <p>Questions? Reply to this email and we'll help.</p>
        <p>Best,<br>The Settler Team</p>
      </div>
    </body>
    </html>
  `;
}
function getDay29FinalTemplate() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Last Chance: Your Trial Ends Tomorrow</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">⚠️ Last Chance</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi {{name}},</p>
        <p><strong>Your trial ends tomorrow!</strong></p>
        <p>You've run {{reconciliations}} reconciliations. Upgrade now to keep everything you've built.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{upgradeUrl}}" style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">Upgrade Now - Only $99/mo</a>
        </div>
        <p>After tomorrow, you'll be moved to the free plan with limited features.</p>
        <p>Questions? Reply to this email - we're here to help.</p>
        <p>Best,<br>The Settler Team</p>
      </div>
    </body>
    </html>
  `;
}
function getDay30TrialEndedTemplate() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Trial Has Ended</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Trial Ended</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi {{name}},</p>
        <p>Your trial has ended. You've been moved to the free plan.</p>
        <p>You can still:</p>
        <ul>
          <li>Access your existing jobs and data</li>
          <li>Run up to 1,000 reconciliations per month</li>
          <li>Use basic features</li>
        </ul>
        <p>Want to upgrade? You'll get:</p>
        <ul>
          <li>Unlimited reconciliations</li>
          <li>All advanced features</li>
          <li>Priority support</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{upgradeUrl}}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Upgrade Now</a>
          <a href="{{freeTierUrl}}" style="margin-left: 10px; color: #667eea; text-decoration: none;">Continue on Free Plan</a>
        </div>
        <p>Best,<br>The Settler Team</p>
      </div>
    </body>
    </html>
  `;
}
//# sourceMappingURL=templates.js.map