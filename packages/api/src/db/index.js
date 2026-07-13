"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.Pool = void 0;
exports.query = query;
exports.queryWithTenant = queryWithTenant;
exports.assertTenantScoped = assertTenantScoped;
exports.tenantScopedQuery = tenantScopedQuery;
exports.transaction = transaction;
exports.transactionWithTenant = transactionWithTenant;
exports.initDatabase = initDatabase;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var pg_1 = require("pg");
Object.defineProperty(exports, "Pool", {
  enumerable: true,
  get: function () {
    return pg_1.Pool;
  },
});
var config_1 = require("../config");
var logger_1 = require("../utils/logger");
var TenantContext_1 = require("../infrastructure/tenancy/TenantContext");
// Database connection pool with proper configuration
exports.pool = new pg_1.Pool({
  host: config_1.config.database.host,
  port: config_1.config.database.port,
  database: config_1.config.database.name,
  user: config_1.config.database.user,
  password: config_1.config.database.password,
  max: config_1.config.database.poolMax,
  min: config_1.config.database.poolMin,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: config_1.config.database.connectionTimeout,
  statement_timeout: config_1.config.database.statementTimeout,
  query_timeout: config_1.config.database.statementTimeout,
  ssl: config_1.config.database.ssl
    ? {
        rejectUnauthorized:
          config_1.config.nodeEnv === "production" || config_1.config.nodeEnv === "preview",
      }
    : false,
});
exports.pool.on("error", function (err) {
  (0, logger_1.logError)("Unexpected error on idle client", err);
  process.exit(-1);
});
/**
 * @deprecated WARNING: This function does NOT enforce tenant isolation!
 * It bypasses RLS policies and should only be used for:
 * - Admin/schema operations
 * - Tenant management queries (where tenant context doesn't exist yet)
 * - Migrations
 *
 * For all tenant-scoped data access, use queryWithTenant() from TenantEnforcement
 * or use the TenantScopedRepository base class.
 *
 * See docs/SECURITY_INVARIANTS.md for details.
 */
function query(text, params) {
  return __awaiter(this, void 0, void 0, function () {
    var client, result;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          // Log warning in development to help identify unscoped queries
          if (config_1.config.nodeEnv === "development") {
            console.warn(
              "[SECURITY WARNING] Unscoped query() called. Stack: ".concat(new Error().stack)
            );
          }
          return [4 /*yield*/, exports.pool.connect()];
        case 1:
          client = _a.sent();
          _a.label = 2;
        case 2:
          _a.trys.push([2, , 4, 5]);
          return [4 /*yield*/, client.query(text, params)];
        case 3:
          result = _a.sent();
          return [2 /*return*/, result.rows];
        case 4:
          client.release();
          return [7 /*endfinally*/];
        case 5:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Execute a query with mandatory tenant context
 * This is the REQUIRED way to query tenant-scoped data
 */
function queryWithTenant(tenantId, text, params) {
  return __awaiter(this, void 0, void 0, function () {
    var client, result;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          // Validate tenant ID
          if (
            !tenantId ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              tenantId
            )
          ) {
            throw new Error(
              "[TENANT ISOLATION VIOLATION] Invalid or missing tenantId: ".concat(tenantId)
            );
          }
          // Runtime assertion to prevent unscoped tenant-table access.
          assertTenantScoped(text);
          return [4 /*yield*/, exports.pool.connect()];
        case 1:
          client = _a.sent();
          _a.label = 2;
        case 2:
          _a.trys.push([2, , 5, 7]);
          // Set tenant context for RLS
          return [4 /*yield*/, TenantContext_1.TenantContext.setTenantContext(client, tenantId)];
        case 3:
          // Set tenant context for RLS
          _a.sent();
          return [4 /*yield*/, client.query(text, params)];
        case 4:
          result = _a.sent();
          return [2 /*return*/, result.rows];
        case 5:
          return [4 /*yield*/, TenantContext_1.TenantContext.clearTenantContext(client)];
        case 6:
          _a.sent();
          client.release();
          return [7 /*endfinally*/];
        case 7:
          return [2 /*return*/];
      }
    });
  });
}
// ============================================================================
// TENANT-SCOPED QUERY GUARD
// ============================================================================
// Tables that MUST include tenant_id in every SELECT/UPDATE/DELETE WHERE clause.
// INSERT is excluded because tenant_id is set by DB triggers or explicitly.
//
// IMPORTANT: Every public table with a tenant_id column MUST be listed here.
// If you add a new tenant-scoped table, add it to this set. The assertTenantScoped
// guard will throw for any query on these tables that omits tenant_id.
var TENANT_SCOPED_TABLES = new Set([
  // Core user & tenant tables
  "users",
  "jobs",
  "executions",
  "matches",
  "unmatched",
  "reports",
  "webhooks",
  "api_keys",
  "webhook_configs",
  "webhook_payloads",
  "audit_logs",
  "idempotency_keys",
  "tenant_usage",
  "tenant_quota_usage",
  "audit_exports",
  "alert_rules",
  "alert_history",
  "operator_runtime_events",
  // Reconciliation core tables
  "recon_jobs",
  "recon_results",
  "recon_audits",
  "recon_runs",
  "recon_templates",
  "reconciliation_matches",
  "reconciliation_candidates",
  "reconciliation_graph_edges",
  "reconciliation_graph_nodes",
  "normalized_transactions",
  // Evidence & proofpack tables
  "proof_packages",
  "exception_adjudication_memory",
  "exception_archetypes",
  // Ingestion & export tables
  "ingestions",
  "ingestion_sources",
  "exports",
  "tolerance_settings",
  // Intelligence & analytics tables
  "ai_analyses",
  "ai_analysis_usage",
  "ai_usage_events",
  "ai_usage_quotas",
  // Billing & account tables
  "billing_accounts",
  "account_balances",
  // Activity & notification tables
  "activity_logs",
  "notifications",
  "alert_notifications",
  "alerts",
]);
/**
 * Asserts that a SQL query touching tenant-scoped tables includes a tenant_id filter.
 * This is a lightweight runtime guard that prevents accidental unscoped queries.
 *
 * Skipped for: DDL (CREATE/ALTER/DROP), INSERT without subselect, RETURNING-only.
 * Active for: SELECT, UPDATE, DELETE on tenant-scoped tables.
 *
 * SECURITY: Throws in ALL environments (including production).
 * A missing tenant_id filter is a data isolation violation that must never
 * be silently allowed. If this breaks a query, the query is wrong.
 */
function assertTenantScoped(sql) {
  var normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();
  // Skip DDL and schema operations
  if (
    /^(create|alter|drop|grant|revoke|set|reset|begin|commit|rollback|explain)\b/.test(normalized)
  ) {
    return;
  }
  // Skip INSERT without subselect (INSERT VALUES is safe — tenant_id set by trigger or caller)
  if (/^insert\b/.test(normalized) && !normalized.includes("select")) {
    return;
  }
  // Determine which tenant-scoped tables are referenced
  for (
    var _i = 0, TENANT_SCOPED_TABLES_1 = TENANT_SCOPED_TABLES;
    _i < TENANT_SCOPED_TABLES_1.length;
    _i++
  ) {
    var table = TENANT_SCOPED_TABLES_1[_i];
    // Match table name as a word boundary (handles "FROM users", "JOIN users", "UPDATE users")
    var tablePattern = new RegExp("\\b".concat(table, "\\b"));
    if (!tablePattern.test(normalized)) {
      continue;
    }
    // Check if tenant_id appears in the WHERE clause
    if (!normalized.includes("tenant_id")) {
      var message = 'TENANT ISOLATION VIOLATION: Query on "'
        .concat(table, '" missing tenant_id filter. SQL: ')
        .concat(sql.substring(0, 200));
      // HARDENED: Always throw. Never silently allow unscoped tenant queries.
      (0, logger_1.logError)(message);
      throw new Error(message);
    }
    // Found the table and it has tenant_id — pass
    return;
  }
}
/**
 * Tenant-scoped query helper. Use this instead of raw `query()` for all
 * application-level data access. It enforces the tenant_id guard.
 */
function tenantScopedQuery(text, params) {
  return __awaiter(this, void 0, void 0, function () {
    return __generator(this, function (_a) {
      assertTenantScoped(text);
      return [2 /*return*/, query(text, params)];
    });
  });
}
// Transaction helper
function transaction(callback) {
  return __awaiter(this, void 0, void 0, function () {
    var client, result, error_1;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4 /*yield*/, exports.pool.connect()];
        case 1:
          client = _a.sent();
          _a.label = 2;
        case 2:
          _a.trys.push([2, 6, 8, 9]);
          return [4 /*yield*/, client.query("BEGIN")];
        case 3:
          _a.sent();
          return [4 /*yield*/, callback(client)];
        case 4:
          result = _a.sent();
          return [4 /*yield*/, client.query("COMMIT")];
        case 5:
          _a.sent();
          return [2 /*return*/, result];
        case 6:
          error_1 = _a.sent();
          return [4 /*yield*/, client.query("ROLLBACK")];
        case 7:
          _a.sent();
          throw error_1;
        case 8:
          client.release();
          return [7 /*endfinally*/];
        case 9:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Execute a transaction with mandatory tenant context
 * This is the REQUIRED way to execute tenant-scoped transactions
 */
function transactionWithTenant(tenantId, callback) {
  return __awaiter(this, void 0, void 0, function () {
    var client, result, error_2;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          // Validate tenant ID
          if (
            !tenantId ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              tenantId
            )
          ) {
            throw new Error(
              "[TENANT ISOLATION VIOLATION] Invalid or missing tenantId: ".concat(tenantId)
            );
          }
          return [4 /*yield*/, exports.pool.connect()];
        case 1:
          client = _a.sent();
          _a.label = 2;
        case 2:
          _a.trys.push([2, 7, 9, 11]);
          return [4 /*yield*/, TenantContext_1.TenantContext.setTenantContext(client, tenantId)];
        case 3:
          _a.sent();
          return [4 /*yield*/, client.query("BEGIN")];
        case 4:
          _a.sent();
          return [4 /*yield*/, callback(client)];
        case 5:
          result = _a.sent();
          return [4 /*yield*/, client.query("COMMIT")];
        case 6:
          _a.sent();
          return [2 /*return*/, result];
        case 7:
          error_2 = _a.sent();
          return [4 /*yield*/, client.query("ROLLBACK")];
        case 8:
          _a.sent();
          throw error_2;
        case 9:
          return [4 /*yield*/, TenantContext_1.TenantContext.clearTenantContext(client)];
        case 10:
          _a.sent();
          client.release();
          return [7 /*endfinally*/];
        case 11:
          return [2 /*return*/];
      }
    });
  });
}
// Initialize database schema
function initDatabase() {
  return __awaiter(this, void 0, void 0, function () {
    var migrationModule,
      error_3,
      message,
      migrationPath,
      migrationSQL,
      statements,
      _i,
      statements_1,
      statement,
      error_4,
      errorMessage;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [
            4 /*yield*/,
            Promise.resolve()
              .then(function () {
                return require("./migrate");
              })
              .catch(function (error) {
                var message = error instanceof Error ? error.message : "Unknown error";
                (0, logger_1.logWarn)("Migration runner failed, falling back to basic schema", {
                  message: message,
                });
                return null;
              }),
          ];
        case 1:
          migrationModule = _a.sent();
          if (
            !(migrationModule === null || migrationModule === void 0
              ? void 0
              : migrationModule.runMigrations)
          )
            return [3 /*break*/, 5];
          _a.label = 2;
        case 2:
          _a.trys.push([2, 4, , 5]);
          // Run all migrations in order
          return [4 /*yield*/, migrationModule.runMigrations()];
        case 3:
          // Run all migrations in order
          _a.sent();
          return [2 /*return*/];
        case 4:
          error_3 = _a.sent();
          message = error_3 instanceof Error ? error_3.message : "Unknown error";
          (0, logger_1.logWarn)("Migration runner failed, falling back to basic schema", {
            message: message,
          });
          return [3 /*break*/, 5];
        case 5:
          migrationPath = node_path_1.default.join(
            __dirname,
            "migrations",
            "001-initial-schema.sql"
          );
          if (!node_fs_1.default.existsSync(migrationPath)) return [3 /*break*/, 12];
          migrationSQL = node_fs_1.default.readFileSync(migrationPath, "utf8");
          statements = migrationSQL.split(";").filter(function (s) {
            return s.trim().length > 0;
          });
          ((_i = 0), (statements_1 = statements));
          _a.label = 6;
        case 6:
          if (!(_i < statements_1.length)) return [3 /*break*/, 11];
          statement = statements_1[_i];
          if (!(statement.trim() && !statement.trim().startsWith("--"))) return [3 /*break*/, 10];
          _a.label = 7;
        case 7:
          _a.trys.push([7, 9, , 10]);
          return [4 /*yield*/, query(statement)];
        case 8:
          _a.sent();
          return [3 /*break*/, 10];
        case 9:
          error_4 = _a.sent();
          errorMessage = error_4 instanceof Error ? error_4.message : String(error_4);
          if (
            !errorMessage.includes("already exists") &&
            !errorMessage.includes("duplicate") &&
            !errorMessage.includes("already enabled")
          ) {
            (0, logger_1.logWarn)("Migration warning", { errorMessage: errorMessage });
          }
          return [3 /*break*/, 10];
        case 10:
          _i++;
          return [3 /*break*/, 6];
        case 11:
          return [3 /*break*/, 13];
        case 12:
          // Legacy custom migrations have been replaced by Prisma.
          // Use Prisma for database schema management:
          //   npx prisma migrate deploy
          //   npx prisma db push
          (0, logger_1.logWarn)(
            "No legacy migration files found. Database schema is now managed via Prisma. " +
              "Run 'npx prisma migrate deploy' or 'npx prisma db push' to set up the database.",
            { migrationPath: migrationPath }
          );
          _a.label = 13;
        case 13:
          return [2 /*return*/];
      }
    });
  });
}
