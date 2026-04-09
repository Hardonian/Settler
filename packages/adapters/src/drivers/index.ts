/**
 * Connector Drivers Registry
 *
 * Export all connector drivers
 */

export { PlaidDriver } from "./plaid";
export { TrueLayerDriver } from "./truelayer";
export { FreshBooksDriver } from "./freshbooks";
export { WaveDriver } from "./wave";
export { ChargebeeDriver } from "./chargebee";
export { RecurlyDriver } from "./recurly";
export { StripeConnectDriver } from "./stripe-connect";
export { AmazonSellerDriver } from "./amazon-seller";
export { EtsyDriver } from "./etsy";
export { EbayDriver } from "./ebay";
export { NetSuiteDriver } from "./netsuite";
export { SapDriver } from "./sap";
export { AvalaraDriver } from "./avalara";
export { TaxJarDriver } from "./taxjar";

import { ConnectorDriver } from "../connector-driver";
import { PlaidDriver } from "./plaid";
import { TrueLayerDriver } from "./truelayer";
import { FreshBooksDriver } from "./freshbooks";
import { WaveDriver } from "./wave";
import { ChargebeeDriver } from "./chargebee";
import { RecurlyDriver } from "./recurly";
import { StripeConnectDriver } from "./stripe-connect";
import { AmazonSellerDriver } from "./amazon-seller";
import { EtsyDriver } from "./etsy";
import { EbayDriver } from "./ebay";
import { NetSuiteDriver } from "./netsuite";
import { SapDriver } from "./sap";
import { AvalaraDriver } from "./avalara";
import { TaxJarDriver } from "./taxjar";

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
  "stripe-connect": () => new StripeConnectDriver(),
  "amazon-seller": () => new AmazonSellerDriver(),
  etsy: () => new EtsyDriver(),
  ebay: () => new EbayDriver(),
  netsuite: () => new NetSuiteDriver(),
  sap: () => new SapDriver(),
  avalara: () => new AvalaraDriver(),
  taxjar: () => new TaxJarDriver(),
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
