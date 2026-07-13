"use strict";
/**
 * Database Migration Runner (DEPRECATED)
 *
 * WARNING: This module is deprecated. Database migrations are now managed via Prisma.
 * Use 'npx prisma migrate deploy' or 'npx prisma db push' instead.
 *
 * This file is kept for backwards compatibility but will fail if legacy migration
 * files (001-initial-schema.sql, etc.) are not present in src/db/migrations/.
 *
 * Supports both PostgreSQL (via pg) and Supabase
 */
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
exports.runMigrations = runMigrations;
var pg_1 = require("pg");
var config_1 = require("../config");
var logger_1 = require("../utils/logger");
var fs = require("fs");
var path = require("path");
/**
 * Execute SQL migration file
 */
function executeMigration(migrationPath, migrationName, useSupabase) {
  return __awaiter(this, void 0, void 0, function () {
    var result,
      migrationSQL,
      statements,
      connectionString,
      supabaseUrl,
      hostMatch,
      host,
      pool,
      _i,
      statements_1,
      statement,
      error_1,
      errorMessage,
      error_2;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          result = {
            migration: migrationName,
            success: false,
            statementsExecuted: 0,
          };
          _a.label = 1;
        case 1:
          _a.trys.push([1, 9, , 10]);
          if (!fs.existsSync(migrationPath)) {
            throw new Error("Migration file not found: ".concat(migrationPath));
          }
          migrationSQL = fs.readFileSync(migrationPath, "utf8");
          statements = migrationSQL
            .split(/;(?![^$]*\$\$)/) // Split on semicolon, but not inside $$ blocks
            .map(function (s) {
              return s.trim();
            })
            .filter(function (s) {
              return s.length > 0 && !s.startsWith("--");
            });
          (0, logger_1.logInfo)("Running migration: ".concat(migrationName), {
            statements: statements.length,
          });
          connectionString = process.env.DATABASE_URL;
          if (!connectionString && useSupabase) {
            // Try to construct Supabase connection string
            // Supabase provides direct database connection via DATABASE_URL or we can construct it
            if (process.env.SUPABASE_DB_PASSWORD) {
              supabaseUrl = process.env.SUPABASE_URL || "";
              hostMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
              host = hostMatch
                ? "".concat(hostMatch[1], ".supabase.co")
                : config_1.config.database.host;
              connectionString = "postgresql://postgres:"
                .concat(process.env.SUPABASE_DB_PASSWORD, "@")
                .concat(host, ":")
                .concat(config_1.config.database.port || 5432, "/postgres");
            } else {
              // Fallback to config-based connection
              connectionString = "postgresql://"
                .concat(config_1.config.database.user, ":")
                .concat(config_1.config.database.password, "@")
                .concat(config_1.config.database.host, ":")
                .concat(config_1.config.database.port, "/")
                .concat(config_1.config.database.name);
            }
          }
          if (!connectionString) {
            // Fallback to config-based connection
            connectionString = "postgresql://"
              .concat(config_1.config.database.user, ":")
              .concat(config_1.config.database.password, "@")
              .concat(config_1.config.database.host, ":")
              .concat(config_1.config.database.port, "/")
              .concat(config_1.config.database.name);
          }
          pool = new pg_1.Pool({
            connectionString: connectionString,
            ssl:
              config_1.config.database.ssl || useSupabase
                ? {
                    rejectUnauthorized:
                      config_1.config.nodeEnv === "production" ||
                      config_1.config.nodeEnv === "preview",
                  }
                : false,
          });
          ((_i = 0), (statements_1 = statements));
          _a.label = 2;
        case 2:
          if (!(_i < statements_1.length)) return [3 /*break*/, 7];
          statement = statements_1[_i];
          if (!(statement.trim() && !statement.trim().startsWith("--"))) return [3 /*break*/, 6];
          _a.label = 3;
        case 3:
          _a.trys.push([3, 5, , 6]);
          return [4 /*yield*/, pool.query(statement)];
        case 4:
          _a.sent();
          result.statementsExecuted++;
          return [3 /*break*/, 6];
        case 5:
          error_1 = _a.sent();
          errorMessage = error_1 instanceof Error ? error_1.message : String(error_1);
          if (
            errorMessage.includes("already exists") ||
            errorMessage.includes("duplicate") ||
            errorMessage.includes("already enabled") ||
            (errorMessage.includes("does not exist") && errorMessage.includes("DROP"))
          ) {
            (0, logger_1.logWarn)("Migration warning (ignored)", { message: errorMessage });
            return [3 /*break*/, 6];
          }
          throw error_1;
        case 6:
          _i++;
          return [3 /*break*/, 2];
        case 7:
          return [4 /*yield*/, pool.end()];
        case 8:
          _a.sent();
          result.success = true;
          (0, logger_1.logInfo)("Migration completed: ".concat(migrationName), {
            statements: result.statementsExecuted,
          });
          return [3 /*break*/, 10];
        case 9:
          error_2 = _a.sent();
          result.error = error_2 instanceof Error ? error_2.message : String(error_2);
          (0, logger_1.logError)("Migration failed: ".concat(migrationName), error_2);
          throw error_2;
        case 10:
          return [2 /*return*/, result];
      }
    });
  });
}
/**
 * Initialize Supabase extensions
 */
function initializeSupabaseExtensions() {
  return __awaiter(this, void 0, void 0, function () {
    var extensions,
      connectionString,
      useSupabase,
      supabaseUrl,
      hostMatch,
      projectRef,
      region,
      host,
      pool,
      _i,
      extensions_1,
      ext,
      error_3,
      errorMessage,
      error_4;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          _a.trys.push([0, 8, , 9]);
          (0, logger_1.logInfo)("Initializing Supabase extensions...");
          extensions = [
            { name: "uuid-ossp", sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";' },
            { name: "pgcrypto", sql: 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";' },
            { name: "vector", sql: "CREATE EXTENSION IF NOT EXISTS vector;" },
          ];
          connectionString = process.env.DATABASE_URL;
          useSupabase = !!process.env.SUPABASE_URL;
          if (!connectionString && useSupabase) {
            if (process.env.SUPABASE_DB_PASSWORD) {
              supabaseUrl = process.env.SUPABASE_URL || "";
              hostMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
              if (hostMatch) {
                projectRef = hostMatch[1];
                region = process.env.DB_REGION || "us-west-2";
                host = "aws-0-".concat(region, ".pooler.supabase.com");
                connectionString = "postgresql://postgres."
                  .concat(projectRef, ":")
                  .concat(process.env.SUPABASE_DB_PASSWORD, "@")
                  .concat(host, ":5432/postgres");
              } else {
                connectionString = "postgresql://"
                  .concat(config_1.config.database.user, ":")
                  .concat(config_1.config.database.password, "@")
                  .concat(config_1.config.database.host, ":")
                  .concat(config_1.config.database.port, "/")
                  .concat(config_1.config.database.name);
              }
            } else {
              connectionString = "postgresql://"
                .concat(config_1.config.database.user, ":")
                .concat(config_1.config.database.password, "@")
                .concat(config_1.config.database.host, ":")
                .concat(config_1.config.database.port, "/")
                .concat(config_1.config.database.name);
            }
          }
          if (!connectionString) {
            connectionString = "postgresql://"
              .concat(config_1.config.database.user, ":")
              .concat(config_1.config.database.password, "@")
              .concat(config_1.config.database.host, ":")
              .concat(config_1.config.database.port, "/")
              .concat(config_1.config.database.name);
          }
          pool = new pg_1.Pool({
            connectionString: connectionString,
            ssl:
              config_1.config.database.ssl || useSupabase
                ? {
                    rejectUnauthorized:
                      config_1.config.nodeEnv === "production" ||
                      config_1.config.nodeEnv === "preview",
                  }
                : false,
          });
          ((_i = 0), (extensions_1 = extensions));
          _a.label = 1;
        case 1:
          if (!(_i < extensions_1.length)) return [3 /*break*/, 6];
          ext = extensions_1[_i];
          _a.label = 2;
        case 2:
          _a.trys.push([2, 4, , 5]);
          return [4 /*yield*/, pool.query(ext.sql)];
        case 3:
          _a.sent();
          (0, logger_1.logInfo)("Extension enabled: ".concat(ext.name));
          return [3 /*break*/, 5];
        case 4:
          error_3 = _a.sent();
          errorMessage = error_3 instanceof Error ? error_3.message : String(error_3);
          if (
            errorMessage.includes("already exists") ||
            errorMessage.includes("permission denied")
          ) {
            (0, logger_1.logWarn)("Extension ".concat(ext.name), { message: errorMessage });
          } else {
            (0, logger_1.logError)("Failed to enable extension ".concat(ext.name), error_3);
          }
          return [3 /*break*/, 5];
        case 5:
          _i++;
          return [3 /*break*/, 1];
        case 6:
          return [4 /*yield*/, pool.end()];
        case 7:
          _a.sent();
          return [3 /*break*/, 9];
        case 8:
          error_4 = _a.sent();
          (0, logger_1.logWarn)("Supabase extension initialization warning", {
            error: error_4 instanceof Error ? error_4.message : String(error_4),
            stack: error_4 instanceof Error ? error_4.stack : undefined,
          });
          return [3 /*break*/, 9];
        case 9:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Run all migrations in order
 */
function runMigrations() {
  return __awaiter(this, void 0, void 0, function () {
    var results,
      useSupabase,
      migrations,
      migrationsDir,
      _i,
      migrations_1,
      migrationFile,
      migrationPath,
      result,
      error_5,
      successCount,
      failCount;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          results = [];
          useSupabase = !!process.env.SUPABASE_URL;
          (0, logger_1.logInfo)("Starting database migrations...", { useSupabase: useSupabase });
          if (!useSupabase) return [3 /*break*/, 2];
          return [4 /*yield*/, initializeSupabaseExtensions()];
        case 1:
          _a.sent();
          _a.label = 2;
        case 2:
          migrations = [
            "001-initial-schema.sql",
            "002-strategic-initiatives.sql",
            "003-canonical-data-model.sql",
          ];
          migrationsDir = path.join(__dirname, "migrations");
          ((_i = 0), (migrations_1 = migrations));
          _a.label = 3;
        case 3:
          if (!(_i < migrations_1.length)) return [3 /*break*/, 8];
          migrationFile = migrations_1[_i];
          migrationPath = path.join(migrationsDir, migrationFile);
          _a.label = 4;
        case 4:
          _a.trys.push([4, 6, , 7]);
          return [4 /*yield*/, executeMigration(migrationPath, migrationFile, useSupabase)];
        case 5:
          result = _a.sent();
          results.push(result);
          if (!result.success) {
            (0, logger_1.logError)(
              "Migration ".concat(migrationFile, " failed, stopping migration process")
            );
            return [3 /*break*/, 8];
          }
          return [3 /*break*/, 7];
        case 6:
          error_5 = _a.sent();
          results.push({
            migration: migrationFile,
            success: false,
            error: error_5 instanceof Error ? error_5.message : String(error_5),
            statementsExecuted: 0,
          });
          (0, logger_1.logError)("Migration ".concat(migrationFile, " failed"), error_5);
          throw error_5;
        case 7:
          _i++;
          return [3 /*break*/, 3];
        case 8:
          successCount = results.filter(function (r) {
            return r.success;
          }).length;
          failCount = results.filter(function (r) {
            return !r.success;
          }).length;
          (0, logger_1.logInfo)("Migration process completed", {
            total: results.length,
            successful: successCount,
            failed: failCount,
          });
          return [2 /*return*/, results];
      }
    });
  });
}
/**
 * CLI entry point
 */
if (require.main === module) {
  runMigrations()
    .then(function (results) {
      var failed = results.filter(function (r) {
        return !r.success;
      });
      if (failed.length > 0) {
        // CLI usage - console is acceptable here
        console.error("Some migrations failed:");
        failed.forEach(function (r) {
          console.error("  - ".concat(r.migration, ": ").concat(r.error));
        });
        process.exit(1);
      } else {
        // CLI usage - console is acceptable here
        (0, logger_1.logInfo)("All migrations completed successfully");
        process.exit(0);
      }
    })
    .catch(function (error) {
      // CLI usage - console is acceptable here
      (0, logger_1.logError)("Migration process failed", error);
      process.exit(1);
    });
}
