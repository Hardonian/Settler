/**
 * @jobforge/adapter-settler
 * JobForge adapter for Settler (contract management platform)
 */

import { z } from 'zod'

/**
 * Job Type: settler.contract.process
 * Process uploaded contract documents
 */
export const SettlerContractProcessPayloadSchema = z.object({
  contract_id: z.string().uuid(),
  document_url: z.string().url(),
  tenant_id: z.string().uuid(),
  extract_fields: z
    .array(z.string())
    .default(['parties', 'effective_date', 'expiration_date', 'payment_terms']),
  notify_on_complete: z.boolean().default(true),
})

export type SettlerContractProcessPayload = z.infer<typeof SettlerContractProcessPayloadSchema>

export interface SettlerContractProcessResult {
  contract_id: string
  extracted_data: Record<string, unknown>
  confidence_scores: Record<string, number>
  review_required: boolean
}

/**
 * Job Type: settler.notification.send
 * Send contract-related notifications
 */
export const SettlerNotificationSendPayloadSchema = z.object({
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  notification_type: z.enum([
    'contract_expiring',
    'signature_required',
    'contract_executed',
    'review_requested',
  ]),
  contract_id: z.string().uuid(),
  metadata: z.record(z.unknown()).optional(),
  channels: z.array(z.enum(['email', 'sms', 'in_app'])).default(['email', 'in_app']),
})

export type SettlerNotificationSendPayload = z.infer<typeof SettlerNotificationSendPayloadSchema>

export interface SettlerNotificationSendResult {
  notification_id: string
  channels_sent: string[]
  failed_channels: string[]
}

/**
 * Job Type: settler.report.monthly
 * Generate monthly contract analytics report
 */
export const SettlerReportMonthlyPayloadSchema = z.object({
  tenant_id: z.string().uuid(),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  include_charts: z.boolean().default(true),
  delivery_emails: z.array(z.string().email()).optional(),
})

export type SettlerReportMonthlyPayload = z.infer<typeof SettlerReportMonthlyPayloadSchema>

export interface SettlerReportMonthlyResult {
  report_id: string
  total_contracts: number
  new_contracts: number
  expiring_contracts: number
  total_value: number
  artifact_ref: string
}

/**
 * Integration examples for Settler
 */
export const SETTLER_INTEGRATION_EXAMPLES = {
  serverAction: `
// app/actions/contract.ts
'use server';

import { JobForgeClient } from '@jobforge/sdk-ts';

const jobforge = new JobForgeClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
});

export async function processContract(contractId: string, documentUrl: string) {
  const job = await jobforge.enqueueJob({
    tenant_id: getTenantId(),
    type: 'settler.contract.process',
    payload: {
      contract_id: contractId,
      document_url: documentUrl,
      tenant_id: getTenantId(),
      extract_fields: ['parties', 'effective_date', 'expiration_date'],
      notify_on_complete: true,
    },
    idempotency_key: \`contract-process-\${contractId}\`,
  });

  return { job_id: job.id };
}
  `,

  apiRoute: `
// app/api/contracts/[id]/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { JobForgeClient } from '@jobforge/sdk-ts';

const jobforge = new JobForgeClient({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { document_url } = await request.json();

  const job = await jobforge.enqueueJob({
    tenant_id: getCurrentTenantId(request),
    type: 'settler.contract.process',
    payload: {
      contract_id: params.id,
      document_url,
      tenant_id: getCurrentTenantId(request),
    },
  });

  return NextResponse.json({ job_id: job.id });
}
  `,

  workerHandler: `
// services/worker-ts/src/handlers/settler.ts
import { JobContext } from '@jobforge/shared';
import { SettlerContractProcessPayload, SettlerContractProcessResult } from '@jobforge/adapter-settler';

export async function settlerContractProcessHandler(
  payload: unknown,
  context: JobContext
): Promise<SettlerContractProcessResult> {
  const validated = SettlerContractProcessPayloadSchema.parse(payload);

  // 1. Download document
  const documentBuffer = await fetch(validated.document_url).then(r => r.arrayBuffer());

  // 2. Extract text (using OCR/PDF parser)
  const extractedText = await extractText(documentBuffer);

  // 3. Parse contract fields
  const extractedData = await parseContractFields(extractedText, validated.extract_fields);

  // 4. Calculate confidence scores
  const confidence_scores = calculateConfidence(extractedData);

  // 5. Determine if review needed
  const review_required = Object.values(confidence_scores).some(score => score < 0.8);

  // 6. Notify if requested
  if (validated.notify_on_complete) {
    await jobforge.enqueueJob({
      tenant_id: validated.tenant_id,
      type: 'settler.notification.send',
      payload: {
        tenant_id: validated.tenant_id,
        user_id: '...', // Get from contract
        notification_type: 'review_requested',
        contract_id: validated.contract_id,
      },
    });
  }

  return {
    contract_id: validated.contract_id,
    extracted_data,
    confidence_scores,
    review_required,
  };
}
  `,
}
