/**
 * Console CLI Commands
 * 
 * Manage Console resources via CLI
 */

import { Command } from 'commander';

export const consoleCommand = new Command('console')
  .description('Manage Console resources');

// API Keys subcommand
const apiKeysCommand = new Command('api-keys')
  .description('Manage API keys');

apiKeysCommand
  .command('list')
  .description('List all API keys')
  .action(async () => {
    const apiKey = process.env.SETTLER_API_KEY || '';
    const baseUrl = process.env.SETTLER_BASE_URL || 'https://api.settler.io';
    
    if (!apiKey) {
      console.error('Error: SETTLER_API_KEY environment variable not set');
      process.exit(1);
    }

    try {
      const response = await fetch(`${baseUrl}/api/console/api-keys`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error:', error.error || 'Failed to fetch API keys');
        process.exit(1);
      }

      const data = await response.json();
      const keys = data.keys || [];

      if (keys.length === 0) {
        console.log('No API keys found.');
        return;
      }

      console.log('\nAPI Keys:');
      console.log('─'.repeat(80));
      keys.forEach((key: any) => {
        console.log(`\nID: ${key.id}`);
        if (key.name) console.log(`Name: ${key.name}`);
        console.log(`Prefix: ${key.keyPrefix}`);
        console.log(`Created: ${new Date(key.createdAt).toLocaleString()}`);
        if (key.lastUsedAt) {
          console.log(`Last Used: ${new Date(key.lastUsedAt).toLocaleString()}`);
        }
        if (key.revokedAt) {
          console.log(`Revoked: ${new Date(key.revokedAt).toLocaleString()}`);
        }
        console.log(`Scopes: ${key.scopes.join(', ')}`);
      });
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

apiKeysCommand
  .command('create')
  .description('Create a new API key')
  .option('-n, --name <name>', 'Key name')
  .option('-s, --scopes <scopes>', 'Comma-separated scopes', '*')
  .action(async (options) => {
    const apiKey = process.env.SETTLER_API_KEY || '';
    const baseUrl = process.env.SETTLER_BASE_URL || 'https://api.settler.io';
    
    if (!apiKey) {
      console.error('Error: SETTLER_API_KEY environment variable not set');
      process.exit(1);
    }

    try {
      const scopes = options.scopes.split(',').map((s: string) => s.trim());
      
      const response = await fetch(`${baseUrl}/api/console/api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: options.name || undefined,
          scopes: scopes,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error:', error.error || 'Failed to create API key');
        process.exit(1);
      }

      const data = await response.json();
      
      console.log('\n✅ API Key created successfully!\n');
      console.log('⚠️  IMPORTANT: Save this key now. You won\'t be able to see it again.\n');
      console.log(`Key: ${data.key}`);
      console.log(`ID: ${data.id}`);
      if (data.name) console.log(`Name: ${data.name}`);
      console.log(`Created: ${new Date(data.createdAt).toLocaleString()}\n`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

apiKeysCommand
  .command('revoke <id>')
  .description('Revoke an API key')
  .action(async (id) => {
    const apiKey = process.env.SETTLER_API_KEY || '';
    const baseUrl = process.env.SETTLER_BASE_URL || 'https://api.settler.io';
    
    if (!apiKey) {
      console.error('Error: SETTLER_API_KEY environment variable not set');
      process.exit(1);
    }

    if (!id) {
      console.error('Error: API key ID required');
      process.exit(1);
    }

    try {
      const response = await fetch(`${baseUrl}/api/console/api-keys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error:', error.error || 'Failed to revoke API key');
        process.exit(1);
      }

      console.log('✅ API key revoked successfully');
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Usage subcommand
const usageCommand = new Command('usage')
  .description('View usage statistics');

usageCommand
  .command('summary')
  .description('Get usage summary')
  .option('-d, --days <days>', 'Number of days', '7')
  .action(async (options) => {
    const apiKey = process.env.SETTLER_API_KEY || '';
    const baseUrl = process.env.SETTLER_BASE_URL || 'https://api.settler.io';
    
    if (!apiKey) {
      console.error('Error: SETTLER_API_KEY environment variable not set');
      process.exit(1);
    }

    try {
      const days = parseInt(options.days, 10);
      const response = await fetch(`${baseUrl}/api/console/usage?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error:', error.error || 'Failed to fetch usage');
        process.exit(1);
      }

      const data = await response.json();
      const summary = data.summary || {};

      console.log('\n📊 Usage Summary (Last ' + days + ' days)');
      console.log('─'.repeat(80));
      console.log(`Total API Calls: ${summary.totalCalls?.toLocaleString() || 0}`);
      console.log(`Error Rate: ${((summary.errorRate || 0) * 100).toFixed(2)}%`);
      console.log(`Active Services: ${Object.keys(summary.byService || {}).length}`);
      
      if (summary.byService && Object.keys(summary.byService).length > 0) {
        console.log('\nBy Service:');
        Object.entries(summary.byService).forEach(([service, count]: [string, any]) => {
          console.log(`  ${service}: ${count.toLocaleString()} calls`);
        });
      }
      
      console.log('');
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Health check subcommand
const healthCommand = new Command('health')
  .description('Check Console health');

healthCommand
  .action(async () => {
    const baseUrl = process.env.SETTLER_BASE_URL || 'https://api.settler.io';
    
    try {
      const response = await fetch(`${baseUrl}/api/health/console`);

      if (!response.ok) {
        console.error('❌ Health check failed');
        process.exit(1);
      }

      const data = await response.json();
      
      console.log('\n🏥 Console Health Check');
      console.log('─'.repeat(80));
      console.log(`Status: ${data.status}`);
      console.log(`Environment: ${data.checks.env.status}`);
      console.log(`Supabase: ${data.checks.supabase.status}`);
      console.log(`Auth: ${data.checks.auth.status}`);
      console.log(`Timestamp: ${new Date(data.timestamp).toLocaleString()}\n`);
      
      if (data.status !== 'healthy') {
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Health check failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Add subcommands
consoleCommand.addCommand(apiKeysCommand);
consoleCommand.addCommand(usageCommand);
consoleCommand.addCommand(healthCommand);
