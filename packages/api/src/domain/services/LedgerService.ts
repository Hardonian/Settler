/**
 * Ledger Service
 *
 * Factory and service layer for ledger repositories.
 * Reads TIGERBEETLE_ENABLED from config and returns the appropriate repository.
 *
 * INVARIANTS:
 * - Always returns a valid repository (never throws during creation)
 * - Provides consistent interface for the rest of the app
 * - Ledger is lazily initialized to allow app boot without TigerBeetle
 */

import { ILedgerRepository } from "../repositories/ILedgerRepository";
import {
  TigerBeetleLedgerRepository,
  createTigerBeetleLedgerRepository,
} from "../../infrastructure/repositories/TigerBeetleLedgerRepository";
import {
  DisabledLedgerRepository,
  createDisabledLedgerRepository,
  LedgerUnavailableError,
} from "../../infrastructure/repositories/DisabledLedgerRepository";
import { logger } from "@settler/types";

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Ledger configuration options
 */
export interface LedgerConfig {
  /** Whether TigerBeetle is enabled */
  enabled: boolean;
  /** TigerBeetle server address */
  address?: string;
  /** TigerBeetle cluster ID */
  clusterId?: number;
  /** Connection timeout in milliseconds */
  timeoutMs?: number;
  /** Max retry attempts */
  maxRetries?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: LedgerConfig = {
  enabled: false, // Disabled by default for safe fallback
  address: "localhost:4300",
  clusterId: 0,
  timeoutMs: 5000,
  maxRetries: 3,
};

// =============================================================================
// Ledger Service
// =============================================================================

/**
 * Ledger Service - provides ledger repository based on configuration
 *
 * This service allows the application to boot without TigerBeetle and gracefully
 * degrade when the ledger is unavailable.
 */
export class LedgerService {
  private repository: ILedgerRepository | null = null;
  private readonly config: LedgerConfig;
  private initialized = false;

  constructor(config?: Partial<LedgerConfig>) {
    // Merge provided config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Check environment variable if not explicitly set
    if (config?.enabled === undefined) {
      this.config.enabled = this.getTigerBeetleEnabledFromEnv();
    }

    logger.info("LedgerService initialized", {
      enabled: this.config.enabled,
      address: this.config.address,
    });
  }

  /**
   * Check TIGERBEETLE_ENABLED from environment
   */
  private getTigerBeetleEnabledFromEnv(): boolean {
    const envValue = process.env.TIGERBEETLE_ENABLED;
    if (envValue === undefined || envValue === "") {
      // Default to disabled for safe fallback
      return false;
    }
    return envValue.toLowerCase() === "true" || envValue === "1";
  }

  /**
   * Get the ledger repository
   * Lazily creates the appropriate repository based on configuration
   */
  getRepository(): ILedgerRepository {
    if (!this.initialized) {
      this.initialize();
    }
    return this.repository!;
  }

  /**
   * Initialize the repository based on configuration
   */
  private initialize(): void {
    if (this.config.enabled) {
      try {
        logger.info("Initializing TigerBeetle ledger repository");
        this.repository = createTigerBeetleLedgerRepository({
          address: this.config.address,
          clusterId: this.config.clusterId,
          timeout: this.config.timeoutMs,
          concurrencyMax: 32,
        });
        logger.info("TigerBeetle ledger repository initialized successfully");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logger.error("Failed to initialize TigerBeetle, falling back to disabled repository", {
          error: message,
        });
        this.repository = createDisabledLedgerRepository(
          `TigerBeetle initialization failed: ${message}`
        );
      }
    } else {
      logger.info("TigerBeetle is disabled, using fallback repository");
      this.repository = createDisabledLedgerRepository(
        "TigerBeetle is not enabled. Set TIGERBEETLE_ENABLED=true to enable."
      );
    }
    this.initialized = true;
  }

  /**
   * Check if ledger is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get the reason why ledger is enabled/disabled
   */
  getReason(): string {
    if (this.config.enabled) {
      return `TigerBeetle is enabled at ${this.config.address}`;
    }
    return "TigerBeetle is not enabled. Set TIGERBEETLE_ENABLED=true to enable.";
  }

  /**
   * Get the current configuration
   */
  getConfig(): LedgerConfig {
    return { ...this.config };
  }

  /**
   * Check if the current repository is the disabled fallback
   */
  isUsingFallback(): boolean {
    if (!this.initialized) {
      this.initialize();
    }
    return this.repository instanceof DisabledLedgerRepository;
  }
}

// =============================================================================
// Factory Function (for non-DI usage)
// =============================================================================

/**
 * Create a LedgerService instance
 */
export function createLedgerService(config?: Partial<LedgerConfig>): LedgerService {
  return new LedgerService(config);
}

/**
 * Create the appropriate ledger repository based on configuration
 * This is a simpler alternative to using the LedgerService
 */
export function createLedgerRepository(config?: Partial<LedgerConfig>): ILedgerRepository {
  const service = new LedgerService(config);
  return service.getRepository();
}

// =============================================================================
// Singleton Instance (for easy access throughout the app)
// =============================================================================

let ledgerServiceInstance: LedgerService | null = null;

/**
 * Get the singleton LedgerService instance
 * Uses lazy initialization to allow app boot without TigerBeetle
 */
export function getLedgerService(config?: Partial<LedgerConfig>): LedgerService {
  if (!ledgerServiceInstance) {
    ledgerServiceInstance = new LedgerService(config);
  }
  return ledgerServiceInstance;
}

/**
 * Get the singleton ledger repository
 * This is the recommended way to access the ledger throughout the app
 */
export function getLedgerRepository(): ILedgerRepository {
  return getLedgerService().getRepository();
}

/**
 * Check if ledger is enabled (singleton)
 */
export function isLedgerEnabled(): boolean {
  return getLedgerService().isEnabled();
}

/**
 * Check if using fallback (singleton)
 */
export function isLedgerUsingFallback(): boolean {
  return getLedgerService().isUsingFallback();
}

/**
 * Get the reason why ledger is enabled/disabled (singleton)
 */
export function getLedgerDisabledReason(): string {
  return getLedgerService().getReason();
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if an error is a LedgerUnavailableError
 */
export function isLedgerUnavailableError(error: unknown): error is LedgerUnavailableError {
  return error instanceof LedgerUnavailableError;
}

/**
 * Check if ledger operation failed due to unavailability
 * Useful for catching and handling graceful degradation
 */
export function isLedgerUnavailable(error: unknown): boolean {
  return isLedgerUnavailableError(error);
}
