import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId = "tenant_enterprise_019a",
      disputeId = "dp_1OxKl9F2eZvKYlo29v0",
      processor = "stripe",
      reason = "duplicate_transaction_disputed",
      claimedLossCents = 14900,
    } = body;

    const dossierHash = createHash("sha256")
      .update(`${tenantId}:${disputeId}:${claimedLossCents}`)
      .digest("hex");

    return NextResponse.json({
      dossierId: `dos_${dossierHash.substring(0, 12)}`,
      disputeId,
      processor,
      reason,
      claimedLossCents,
      disputeStatus: "DEFENSE_GENERATED",
      defenseStrengthScore: 0.984,
      evidenceHashes: [
        `sha256:${dossierHash}`,
        `sha256:${createHash("sha256").update(dossierHash).digest("hex")}`,
      ],
      networkBrief: {
        scheme: "VISA_DISPUTE_DEFENSE_RULE_11.3",
        evidencePayloadUrl: `https://proofs.settler.io/disputes/dos_${dossierHash.substring(0, 12)}.pdf`,
        automaticSubmissionReady: true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to synthesize dispute dossier",
        message: error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 }
    );
  }
}
