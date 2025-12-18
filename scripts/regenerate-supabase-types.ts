/**
 * Regenerate Supabase Types
 * 
 * Generates TypeScript types from Supabase database schema.
 * 
 * Usage:
 *   tsx scripts/regenerate-supabase-types.ts
 * 
 * Environment variables required:
 *   - SUPABASE_URL
 *   - SUPABASE_ANON_KEY (for client types)
 *   - SUPABASE_PROJECT_REF (optional, extracted from URL if not provided)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config();

/**
 * Get Supabase project reference
 */
function getProjectRef(): string {
  // Priority 1: Explicit project ref
  if (process.env.SUPABASE_PROJECT_REF) {
    return process.env.SUPABASE_PROJECT_REF;
  }

  // Priority 2: Extract from URL
  if (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (match) {
      return match[1];
    }
  }

  throw new Error(
    'Supabase project reference not found. Set SUPABASE_PROJECT_REF or SUPABASE_URL'
  );
}

/**
 * Regenerate types using Supabase CLI
 */
async function regenerateTypes() {
  console.log('🔄 Regenerating Supabase TypeScript types...');
  console.log('');

  const projectRef = getProjectRef();
  console.log(`Project Reference: ${projectRef}`);
  console.log('');

  // Check if Supabase CLI is available
  try {
    execSync('supabase --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Supabase CLI not found. Please install it:');
    console.error('   npm install -g supabase');
    console.error('   or');
    console.error('   brew install supabase/tap/supabase');
    process.exit(1);
  }

  // Determine output path
  const outputPath = path.join(
    process.cwd(),
    'packages/web/src/types/database.types.ts'
  );

  // Ensure directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    console.log('📦 Generating types...');
    
    // Use Supabase CLI to generate types
    const command = `supabase gen types typescript --project-id ${projectRef} > "${outputPath}"`;
    
    execSync(command, {
      stdio: 'inherit',
      env: {
        ...process.env,
        // Ensure Supabase CLI uses the correct project
        SUPABASE_PROJECT_REF: projectRef,
      },
    });

    console.log('');
    console.log(`✅ Types generated successfully!`);
    console.log(`   Output: ${outputPath}`);
    console.log('');

    // Verify file was created
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
      
      // Check if file has content
      const content = fs.readFileSync(outputPath, 'utf-8');
      if (content.trim().length === 0) {
        console.log('   ⚠️  Warning: Generated file is empty');
      } else {
        // Count type definitions
        const typeCount = (content.match(/export (type|interface) \w+/g) || []).length;
        console.log(`   Type definitions: ${typeCount}`);
      }
    } else {
      console.log('   ⚠️  Warning: Output file was not created');
    }

    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Review the generated types');
    console.log('   2. Update imports in your code to use the new types');
    console.log('   3. Remove `as any` type assertions where possible');
    console.log('   4. Run TypeScript type checking: npm run typecheck');
  } catch (error) {
    console.error('❌ Failed to generate types:', error);
    console.error('');
    console.error('Alternative: Use Supabase Dashboard');
    console.error('   1. Go to https://supabase.com/dashboard');
    console.error('   2. Select your project');
    console.error('   3. Go to Settings > API');
    console.error('   4. Copy the TypeScript types');
    console.error('   5. Save to packages/web/src/types/database.types.ts');
    process.exit(1);
  }
}

// Run regeneration
regenerateTypes()
  .then(() => {
    console.log('✅ Type regeneration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Type regeneration failed:', error);
    process.exit(1);
  });
