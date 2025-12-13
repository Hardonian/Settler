/**
 * CLI Playground Page
 * 
 * Interactive CLI playground with code editor, request builder, and response viewer.
 */

import { CLIPlayground } from '@/components/console/CLIPlayground';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function CLIPlaygroundPage() {
  return <CLIPlayground />;
}
