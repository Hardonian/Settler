import chalk from 'chalk';
import { JobForgeClient } from '@jobforge/sdk-ts';

export interface JobForgeConfig {
  enabled: boolean;
  bundleExecutionEnabled: boolean;
}

export function getJobForgeConfig(): JobForgeConfig {
  return {
    enabled: ['1', 'true', 'yes'].includes(
      (process.env.JOBFORGE_INTEGRATION_ENABLED ?? '0').toLowerCase()
    ),
    bundleExecutionEnabled: ['1', 'true', 'yes'].includes(
      (process.env.JOBFORGE_BUNDLE_EXECUTION_ENABLED ?? '0').toLowerCase()
    ),
  };
}

export function requireJobForgeClient(): JobForgeClient {
  const config = getJobForgeConfig();
  if (!config.enabled) {
    console.error(
      chalk.red(
        'JobForge integration is disabled. Set JOBFORGE_INTEGRATION_ENABLED=1 to enable.'
      )
    );
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      chalk.red('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for JobForge operations.')
    );
    process.exit(1);
  }

  return new JobForgeClient({
    supabaseUrl,
    supabaseKey,
  });
}

export function parseJsonOption(value?: string): Record<string, unknown> {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    console.error(chalk.red('Invalid JSON provided. Please pass valid JSON.'));
    process.exit(1);
  }
}
