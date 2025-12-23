/**
 * Custom Integrations Service
 * Handles custom adapter development and white-label configurations
 */

import { query } from "../db";
import { logError, logInfo } from "../utils/logger";

export interface CustomIntegration {
  id: string;
  tenantId: string;
  integrationName: string;
  integrationType: string;
  adapterConfig: Record<string, unknown>;
  isActive: boolean;
  whiteLabelConfig?: {
    logoUrl?: string;
    brandColor?: string;
    companyName?: string;
    customDomain?: string;
  };
}

/**
 * Create custom integration
 */
export async function createCustomIntegration(
  tenantId: string,
  integrationName: string,
  integrationType: string,
  adapterConfig: Record<string, unknown>,
  whiteLabelConfig?: Record<string, unknown>
): Promise<string> {
  try {
    const result = await query<{ id: string }>(
      `INSERT INTO custom_integrations (
        tenant_id, integration_name, integration_type,
        adapter_config, white_label_config, is_active
      ) VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id`,
      [
        tenantId,
        integrationName,
        integrationType,
        JSON.stringify(adapterConfig),
        whiteLabelConfig ? JSON.stringify(whiteLabelConfig) : null,
      ] as (string | number | boolean | null | Date)[]
    );

    const integrationId = result[0]?.id || '';
    logInfo("Custom integration created", {
      integrationId,
      tenantId,
      integrationName,
      integrationType,
    });
    return integrationId;
  } catch (error) {
    logError("Failed to create custom integration", error, { tenantId, integrationName });
    throw error;
  }
}

/**
 * Get custom integration
 */
export async function getCustomIntegration(
  tenantId: string,
  integrationId: string
): Promise<CustomIntegration | null> {
  try {
    const result = await query<{
      id: string;
      tenant_id: string;
      integration_name: string;
      integration_type: string;
      adapter_config: Record<string, unknown>;
      white_label_config: Record<string, unknown> | null;
      is_active: boolean;
    }>(
      `SELECT id, tenant_id, integration_name, integration_type,
              adapter_config, white_label_config, is_active
       FROM custom_integrations
       WHERE id = $1 AND tenant_id = $2`,
      [integrationId, tenantId]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;

    return {
      id: row.id,
      tenantId: row.tenant_id,
      integrationName: row.integration_name,
      integrationType: row.integration_type,
      adapterConfig: row.adapter_config,
      isActive: row.is_active,
      whiteLabelConfig: row.white_label_config || undefined,
    };
  } catch (error) {
    logError("Failed to get custom integration", error, { integrationId, tenantId });
    throw error;
  }
}

/**
 * List custom integrations
 */
export async function listCustomIntegrations(
  tenantId: string,
  filters: {
    isActive?: boolean;
    integrationType?: string;
  } = {}
): Promise<CustomIntegration[]> {
  try {
    const conditions: string[] = ["tenant_id = $1"];
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (filters.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      params.push(filters.isActive);
      paramIndex++;
    }

    if (filters.integrationType) {
      conditions.push(`integration_type = $${paramIndex}`);
      params.push(filters.integrationType);
      paramIndex++;
    }

    const result = await query<Record<string, unknown>>(
      `SELECT id, tenant_id, integration_name, integration_type,
              adapter_config, white_label_config, is_active
       FROM custom_integrations
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC`,
      params as (string | number | boolean | null | Date)[]
    );

    return result.map((row) => ({
      id: row.id as string,
      tenantId: row.tenant_id as string,
      integrationName: row.integration_name as string,
      integrationType: row.integration_type as string,
      adapterConfig: row.adapter_config as Record<string, unknown>,
      isActive: row.is_active as boolean,
      whiteLabelConfig: row.white_label_config as Record<string, unknown> | undefined,
    }));
  } catch (error) {
    logError("Failed to list custom integrations", error, { tenantId });
    throw error;
  }
}

/**
 * Update custom integration
 */
export async function updateCustomIntegration(
  tenantId: string,
  integrationId: string,
  updates: {
    adapterConfig?: Record<string, unknown>;
    whiteLabelConfig?: Record<string, unknown>;
    isActive?: boolean;
  }
): Promise<void> {
  try {
    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (updates.adapterConfig !== undefined) {
      updateFields.push(`adapter_config = $${paramIndex}`);
      params.push(JSON.stringify(updates.adapterConfig));
      paramIndex++;
    }

    if (updates.whiteLabelConfig !== undefined) {
      updateFields.push(`white_label_config = $${paramIndex}`);
      params.push(JSON.stringify(updates.whiteLabelConfig));
      paramIndex++;
    }

    if (updates.isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      params.push(updates.isActive);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return;
    }

    updateFields.push(`updated_at = now()`);
    params.push(tenantId, integrationId);

    await query(
      `UPDATE custom_integrations
       SET ${updateFields.join(", ")}
       WHERE tenant_id = $${paramIndex} AND id = $${paramIndex + 1}`,
      params as (string | number | boolean | null | Date)[]
    );

    logInfo("Custom integration updated", { integrationId, tenantId });
  } catch (error) {
    logError("Failed to update custom integration", error, { integrationId, tenantId });
    throw error;
  }
}
