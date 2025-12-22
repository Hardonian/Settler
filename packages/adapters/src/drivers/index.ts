/**
 * Connector Drivers Registry
 * 
 * Export all connector drivers
 */

export { PlaidDriver } from './plaid';
export { TrueLayerDriver } from './truelayer';
export { FreshBooksDriver } from './freshbooks';
export { WaveDriver } from './wave';
export { ChargebeeDriver } from './chargebee';
export { RecurlyDriver } from './recurly';

import { ConnectorDriver } from '../connector-driver';
import { PlaidDriver } from './plaid';
import { TrueLayerDriver } from './truelayer';
import { FreshBooksDriver } from './freshbooks';
import { WaveDriver } from './wave';
import { ChargebeeDriver } from './chargebee';
import { RecurlyDriver } from './recurly';

/**
 * Registry of all available connector drivers
 */
export const CONNECTOR_REGISTRY: Record<string, () => ConnectorDriver> = {
  plaid: () => new PlaidDriver(),
  truelayer: () => new TrueLayerDriver(),
  freshbooks: () => new FreshBooksDriver(),
  wave: () => new WaveDriver(),
  chargebee: () => new ChargebeeDriver(),
  recurly: () => new RecurlyDriver(),
};

/**
 * Get a connector driver by ID
 */
export function getConnectorDriver(connectorId: string): ConnectorDriver | null {
  const factory = CONNECTOR_REGISTRY[connectorId.toLowerCase()];
  return factory ? factory() : null;
}

/**
 * Get all available connector metadata
 */
export function getAllConnectorMetadata() {
  return Object.values(CONNECTOR_REGISTRY).map((factory) => factory().metadata);
}
