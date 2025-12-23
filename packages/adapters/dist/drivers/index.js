"use strict";
/**
 * Connector Drivers Registry
 *
 * Export all connector drivers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONNECTOR_REGISTRY = exports.TaxJarDriver = exports.AvalaraDriver = exports.SapDriver = exports.NetSuiteDriver = exports.EbayDriver = exports.EtsyDriver = exports.AmazonSellerDriver = exports.StripeConnectDriver = exports.RecurlyDriver = exports.ChargebeeDriver = exports.WaveDriver = exports.FreshBooksDriver = exports.TrueLayerDriver = exports.PlaidDriver = void 0;
exports.getConnectorDriver = getConnectorDriver;
exports.getAllConnectorMetadata = getAllConnectorMetadata;
var plaid_1 = require("./plaid");
Object.defineProperty(exports, "PlaidDriver", { enumerable: true, get: function () { return plaid_1.PlaidDriver; } });
var truelayer_1 = require("./truelayer");
Object.defineProperty(exports, "TrueLayerDriver", { enumerable: true, get: function () { return truelayer_1.TrueLayerDriver; } });
var freshbooks_1 = require("./freshbooks");
Object.defineProperty(exports, "FreshBooksDriver", { enumerable: true, get: function () { return freshbooks_1.FreshBooksDriver; } });
var wave_1 = require("./wave");
Object.defineProperty(exports, "WaveDriver", { enumerable: true, get: function () { return wave_1.WaveDriver; } });
var chargebee_1 = require("./chargebee");
Object.defineProperty(exports, "ChargebeeDriver", { enumerable: true, get: function () { return chargebee_1.ChargebeeDriver; } });
var recurly_1 = require("./recurly");
Object.defineProperty(exports, "RecurlyDriver", { enumerable: true, get: function () { return recurly_1.RecurlyDriver; } });
var stripe_connect_1 = require("./stripe-connect");
Object.defineProperty(exports, "StripeConnectDriver", { enumerable: true, get: function () { return stripe_connect_1.StripeConnectDriver; } });
var amazon_seller_1 = require("./amazon-seller");
Object.defineProperty(exports, "AmazonSellerDriver", { enumerable: true, get: function () { return amazon_seller_1.AmazonSellerDriver; } });
var etsy_1 = require("./etsy");
Object.defineProperty(exports, "EtsyDriver", { enumerable: true, get: function () { return etsy_1.EtsyDriver; } });
var ebay_1 = require("./ebay");
Object.defineProperty(exports, "EbayDriver", { enumerable: true, get: function () { return ebay_1.EbayDriver; } });
var netsuite_1 = require("./netsuite");
Object.defineProperty(exports, "NetSuiteDriver", { enumerable: true, get: function () { return netsuite_1.NetSuiteDriver; } });
var sap_1 = require("./sap");
Object.defineProperty(exports, "SapDriver", { enumerable: true, get: function () { return sap_1.SapDriver; } });
var avalara_1 = require("./avalara");
Object.defineProperty(exports, "AvalaraDriver", { enumerable: true, get: function () { return avalara_1.AvalaraDriver; } });
var taxjar_1 = require("./taxjar");
Object.defineProperty(exports, "TaxJarDriver", { enumerable: true, get: function () { return taxjar_1.TaxJarDriver; } });
const plaid_2 = require("./plaid");
const truelayer_2 = require("./truelayer");
const freshbooks_2 = require("./freshbooks");
const wave_2 = require("./wave");
const chargebee_2 = require("./chargebee");
const recurly_2 = require("./recurly");
const stripe_connect_2 = require("./stripe-connect");
const amazon_seller_2 = require("./amazon-seller");
const etsy_2 = require("./etsy");
const ebay_2 = require("./ebay");
const netsuite_2 = require("./netsuite");
const sap_2 = require("./sap");
const avalara_2 = require("./avalara");
const taxjar_2 = require("./taxjar");
/**
 * Registry of all available connector drivers
 */
exports.CONNECTOR_REGISTRY = {
    plaid: () => new plaid_2.PlaidDriver(),
    truelayer: () => new truelayer_2.TrueLayerDriver(),
    freshbooks: () => new freshbooks_2.FreshBooksDriver(),
    wave: () => new wave_2.WaveDriver(),
    chargebee: () => new chargebee_2.ChargebeeDriver(),
    recurly: () => new recurly_2.RecurlyDriver(),
    'stripe-connect': () => new stripe_connect_2.StripeConnectDriver(),
    'amazon-seller': () => new amazon_seller_2.AmazonSellerDriver(),
    etsy: () => new etsy_2.EtsyDriver(),
    ebay: () => new ebay_2.EbayDriver(),
    netsuite: () => new netsuite_2.NetSuiteDriver(),
    sap: () => new sap_2.SapDriver(),
    avalara: () => new avalara_2.AvalaraDriver(),
    taxjar: () => new taxjar_2.TaxJarDriver(),
};
/**
 * Get a connector driver by ID
 */
function getConnectorDriver(connectorId) {
    const factory = exports.CONNECTOR_REGISTRY[connectorId.toLowerCase()];
    return factory ? factory() : null;
}
/**
 * Get all available connector metadata
 */
function getAllConnectorMetadata() {
    return Object.values(exports.CONNECTOR_REGISTRY).map((factory) => factory().metadata);
}
//# sourceMappingURL=index.js.map