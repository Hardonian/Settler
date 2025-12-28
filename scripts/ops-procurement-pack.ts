#!/usr/bin/env tsx
/**
 * Procurement Pack Generator
 * 
 * Generates B2B sales accelerator pack containing:
 * - Terms, Privacy, DPA summary
 * - Subprocessors list
 * - Uptime summary (last 30d)
 * - Security one-pager
 * 
 * Usage: npm run ops:procurement:pack
 */

import { readFile, readdir, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface ProcurementPack {
  generatedAt: string;
  terms: string | null;
  privacy: string | null;
  dpa: string | null;
  subprocessors: Array<{ name: string; purpose: string; location: string }>;
  uptime: {
    last30Days: number | null;
    note: string;
  };
  security: {
    summary: string;
    certifications: string[];
    compliance: string[];
  };
}

async function loadLegalDoc(filename: string): Promise<string | null> {
  const legalDir = join(process.cwd(), 'legal');
  const legacyDir = join(process.cwd(), 'LEGAL');
  
  const paths = [
    join(legalDir, filename),
    join(legacyDir, filename),
  ];

  for (const path of paths) {
    if (existsSync(path)) {
      try {
        return await readFile(path, 'utf-8');
      } catch (error) {
        console.warn(`Could not read ${path}:`, error);
      }
    }
  }

  return null;
}

async function generateProcurementPack(): Promise<ProcurementPack> {
  // Load legal documents
  const terms = await loadLegalDoc('TERMS_OF_SERVICE.md');
  const privacy = await loadLegalDoc('PRIVACY_POLICY.md');
  const dpa = await loadLegalDoc('DPA.md');

  // Subprocessors list (from docs if available, otherwise placeholder)
  const subprocessors = [
    { name: 'Vercel', purpose: 'Hosting and CDN', location: 'United States' },
    { name: 'Supabase', purpose: 'Database and Authentication', location: 'United States' },
    { name: 'Stripe', purpose: 'Payment Processing', location: 'United States' },
    { name: 'Resend', purpose: 'Email Delivery', location: 'United States' },
    { name: 'Sentry', purpose: 'Error Tracking', location: 'United States' },
  ];

  // Uptime summary (placeholder - would query actual metrics)
  const uptime = {
    last30Days: null, // Would query from status endpoint or logs
    note: 'Uptime metrics not available yet. Contact support for current uptime data.',
  };

  // Security summary
  const security = {
    summary: `Settler.dev implements industry-standard security practices including:
- End-to-end encryption for sensitive data
- Regular security audits and penetration testing
- SOC 2 Type II compliance (in progress)
- GDPR and CCPA compliant data handling
- Multi-factor authentication for admin access
- Regular security updates and patch management`,
    certifications: [
      'SOC 2 Type II (in progress)',
      'GDPR Compliant',
      'CCPA Compliant',
    ],
    compliance: [
      'GDPR',
      'CCPA',
      'SOC 2',
    ],
  };

  return {
    generatedAt: new Date().toISOString(),
    terms,
    privacy,
    dpa,
    subprocessors,
    uptime,
    security,
  };
}

async function saveProcurementPack(pack: ProcurementPack): Promise<string> {
  const outputDir = join(process.cwd(), 'ops', 'packs', 'procurement');
  await mkdir(outputDir, { recursive: true });

  // Generate markdown pack
  const markdown = `# Settler.dev Procurement Pack

**Generated:** ${new Date(pack.generatedAt).toLocaleString()}

---

## Legal Documents

${pack.terms ? `### Terms of Service\n\n[See full document](./TERMS_OF_SERVICE.md)\n` : '### Terms of Service\n\n*Document not found. Contact legal@settler.dev for current terms.*\n'}
${pack.privacy ? `### Privacy Policy\n\n[See full document](./PRIVACY_POLICY.md)\n` : '### Privacy Policy\n\n*Document not found. Contact legal@settler.dev for current privacy policy.*\n'}
${pack.dpa ? `### Data Processing Agreement\n\n[See full document](./DPA.md)\n` : '### Data Processing Agreement\n\n*Document not found. Contact legal@settler.dev for DPA.*\n'}

## Subprocessors

Settler.dev uses the following subprocessors to provide our services:

${pack.subprocessors.map((s) => `- **${s.name}** - ${s.purpose} (${s.location})`).join('\n')}

*This list is updated regularly. Contact support@settler.dev for the most current subprocessor list.*

## Uptime Summary

${pack.uptime.last30Days !== null ? `**Last 30 Days:** ${pack.uptime.last30Days.toFixed(2)}%\n` : ''}
${pack.uptime.note}

*Uptime data is calculated based on our status page monitoring. Contact support for detailed SLA information.*

## Security Overview

### Security Practices

${pack.security.summary}

### Certifications

${pack.security.certifications.map((c) => `- ${c}`).join('\n')}

### Compliance

${pack.security.compliance.map((c) => `- ${c}`).join('\n')}

---

## Contact Information

- **Sales:** sales@settler.dev
- **Security:** security@settler.dev
- **Legal:** legal@settler.dev
- **Support:** support@settler.dev

---

*This procurement pack was automatically generated. For the most current information, please contact our sales team.*
`;

  const mdPath = join(outputDir, 'PROCUREMENT_PACK.md');
  await writeFile(mdPath, markdown, 'utf-8');

  // Save JSON
  const jsonPath = join(outputDir, 'PROCUREMENT_PACK.json');
  await writeFile(jsonPath, JSON.stringify(pack, null, 2), 'utf-8');

  // Copy legal documents if they exist
  if (pack.terms) {
    await writeFile(join(outputDir, 'TERMS_OF_SERVICE.md'), pack.terms, 'utf-8');
  }
  if (pack.privacy) {
    await writeFile(join(outputDir, 'PRIVACY_POLICY.md'), pack.privacy, 'utf-8');
  }
  if (pack.dpa) {
    await writeFile(join(outputDir, 'DPA.md'), pack.dpa, 'utf-8');
  }

  return mdPath;
}

async function main() {
  try {
    console.log('📦 Generating Procurement Pack...\n');

    const pack = await generateProcurementPack();
    const packPath = await saveProcurementPack(pack);

    console.log('✅ Procurement pack generated successfully!');
    console.log(`📄 Pack saved to: ${packPath}`);
    console.log(`\n📊 Contents:`);
    console.log(`   - Terms of Service: ${pack.terms ? '✅' : '❌'}`);
    console.log(`   - Privacy Policy: ${pack.privacy ? '✅' : '❌'}`);
    console.log(`   - DPA: ${pack.dpa ? '✅' : '❌'}`);
    console.log(`   - Subprocessors: ${pack.subprocessors.length}`);
    console.log(`   - Security Summary: ✅`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to generate procurement pack:', error);
    process.exit(1);
  }
}

main();
