"use strict";
/**
 * Activation Funnel Instrumentation
 *
 * Emits canonical lifecycle events for product-led growth tracking.
 * Uses existing UsageEvent table for event storage.
 */
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
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
exports.LifecycleEventType = void 0;
exports.emitLifecycleEvent = emitLifecycleEvent;
exports.getActivationFunnelMetrics = getActivationFunnelMetrics;
var prisma_1 = require("../infrastructure/db/prisma");
/**
 * Canonical lifecycle event types
 */
var LifecycleEventType;
(function (LifecycleEventType) {
  LifecycleEventType["USER_SIGNED_UP"] = "user.signed_up";
  LifecycleEventType["TENANT_CREATED"] = "tenant.created";
  LifecycleEventType["PROVIDER_CONNECTED"] = "provider.connected";
  LifecycleEventType["RECON_FIRST_RUN"] = "recon.first_run";
  LifecycleEventType["RECON_EXCEPTION_CREATED"] = "recon.exception_created";
  LifecycleEventType["RECON_EXCEPTION_RESOLVED"] = "recon.exception_resolved";
  LifecycleEventType["BILLING_CHECKOUT_STARTED"] = "billing.checkout_started";
  LifecycleEventType["BILLING_CHECKOUT_COMPLETED"] = "billing.checkout_completed";
  LifecycleEventType["BILLING_PAYMENT_FAILED"] = "billing.payment_failed";
  LifecycleEventType["BILLING_SUBSCRIPTION_CANCELED"] = "billing.subscription_canceled";
})(LifecycleEventType || (exports.LifecycleEventType = LifecycleEventType = {}));
/**
 * Emit a lifecycle event
 */
function emitLifecycleEvent(eventType, params) {
  return __awaiter(this, void 0, void 0, function () {
    var userId,
      tenantId,
      billingAccountId,
      _a,
      properties,
      finalBillingAccountId,
      account,
      tenant,
      user,
      error_1;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 8, , 9]);
          ((userId = params.userId),
            (tenantId = params.tenantId),
            (billingAccountId = params.billingAccountId),
            (_a = params.properties),
            (properties = _a === void 0 ? {} : _a));
          finalBillingAccountId = billingAccountId;
          if (!(!finalBillingAccountId && userId)) return [3 /*break*/, 2];
          return [
            4 /*yield*/,
            prisma_1.prisma.billingAccount.findFirst({
              where: { userId: userId },
              select: { id: true },
            }),
          ];
        case 1:
          account = _b.sent();
          finalBillingAccountId = account === null || account === void 0 ? void 0 : account.id;
          _b.label = 2;
        case 2:
          if (!(!finalBillingAccountId && tenantId)) return [3 /*break*/, 4];
          return [
            4 /*yield*/,
            prisma_1.prisma.tenant.findUnique({
              where: { id: tenantId },
              select: { billingAccountId: true },
            }),
          ];
        case 3:
          tenant = _b.sent();
          finalBillingAccountId =
            (tenant === null || tenant === void 0 ? void 0 : tenant.billingAccountId) || undefined;
          _b.label = 4;
        case 4:
          if (!(!finalBillingAccountId && userId)) return [3 /*break*/, 6];
          return [
            4 /*yield*/,
            prisma_1.prisma.billingAccount.findFirst({
              where: { userId: userId },
              select: { id: true, email: true },
            }),
          ];
        case 5:
          user = _b.sent();
          if (!user) {
            // Would need user email - skip for now if not available
            // Use dynamic import to avoid circular dependencies
            Promise.resolve()
              .then(function () {
                return require("../utils/logger");
              })
              .then(function (_a) {
                var logWarn = _a.logWarn;
                logWarn(
                  "Cannot emit lifecycle event ".concat(eventType, ": no billing account found")
                );
              })
              .catch(function () {
                // Silent fail if logger unavailable
              });
            return [2 /*return*/];
          }
          finalBillingAccountId = user.id;
          _b.label = 6;
        case 6:
          if (!finalBillingAccountId) {
            // Use dynamic import to avoid circular dependencies
            Promise.resolve()
              .then(function () {
                return require("../utils/logger");
              })
              .then(function (_a) {
                var logWarn = _a.logWarn;
                logWarn(
                  "Cannot emit lifecycle event ".concat(
                    eventType,
                    ": no billing account ID available"
                  )
                );
              })
              .catch(function () {
                // Silent fail if logger unavailable
              });
            return [2 /*return*/];
          }
          // Emit event via UsageEvent table
          return [
            4 /*yield*/,
            prisma_1.prisma.usageEvent.create({
              data: {
                billingAccountId: finalBillingAccountId,
                userId: userId || null,
                tenantId: tenantId || null,
                eventType: eventType,
                quantity: 1,
                unit: "event",
                metadata: properties,
                timestamp: new Date(),
                aggregated: false,
              },
            }),
          ];
        case 7:
          // Emit event via UsageEvent table
          _b.sent();
          return [3 /*break*/, 9];
        case 8:
          error_1 = _b.sent();
          // Don't throw - event tracking should never break the main flow
          // Use dynamic import to avoid circular dependencies
          Promise.resolve()
            .then(function () {
              return require("../utils/logger");
            })
            .then(function (_a) {
              var logError = _a.logError;
              logError("Failed to emit lifecycle event ".concat(eventType), error_1);
            })
            .catch(function () {
              // Silent fail if logger unavailable
            });
          return [3 /*break*/, 9];
        case 9:
          return [2 /*return*/];
      }
    });
  });
}
/**
 * Get activation funnel metrics
 */
function getActivationFunnelMetrics(params) {
  return __awaiter(this, void 0, void 0, function () {
    var startDate,
      endDate,
      tenantId,
      where,
      _a,
      signups,
      tenantsCreated,
      providersConnected,
      firstRecons,
      exceptionsCreated,
      exceptionsResolved,
      checkoutsStarted,
      checkoutsCompleted,
      paymentsFailed,
      subscriptionsCanceled,
      conversionRates;
    return __generator(this, function (_b) {
      switch (_b.label) {
        case 0:
          ((startDate = params.startDate),
            (endDate = params.endDate),
            (tenantId = params.tenantId));
          where = {
            timestamp: {
              gte: startDate,
              lt: endDate,
            },
          };
          if (tenantId) {
            where.tenantId = tenantId;
          }
          return [
            4 /*yield*/,
            Promise.all([
              prisma_1.prisma.usageEvent.count({
                where: __assign(__assign({}, where), {
                  eventType: LifecycleEventType.USER_SIGNED_UP,
                }),
              }),
              prisma_1.prisma.usageEvent.count({
                where: __assign(__assign({}, where), {
                  eventType: LifecycleEventType.TENANT_CREATED,
                }),
              }),
              prisma_1.prisma.usageEvent.count({
                where: __assign(__assign({}, where), {
                  eventType: LifecycleEventType.PROVIDER_CONNECTED,
                }),
              }),
              prisma_1.prisma.usageEvent.count({
                where: __assign(__assign({}, where), {
                  eventType: LifecycleEventType.RECON_FIRST_RUN,
                }),
              }),
              prisma_1.prisma.usageEvent.count({
                where: __assign(__assign({}, where), {
                  eventType: LifecycleEventType.RECON_EXCEPTION_CREATED,
                }),
              }),
              prisma_1.prisma.usageEvent.count({
                where: __assign(__assign({}, where), {
                  eventType: LifecycleEventType.RECON_EXCEPTION_RESOLVED,
                }),
              }),
              prisma_1.prisma.usageEvent.count({
                where: __assign(__assign({}, where), {
                  eventType: LifecycleEventType.BILLING_CHECKOUT_STARTED,
                }),
              }),
              prisma_1.prisma.usageEvent.count({
                where: __assign(__assign({}, where), {
                  eventType: LifecycleEventType.BILLING_CHECKOUT_COMPLETED,
                }),
              }),
              prisma_1.prisma.usageEvent.count({
                where: __assign(__assign({}, where), {
                  eventType: LifecycleEventType.BILLING_PAYMENT_FAILED,
                }),
              }),
              prisma_1.prisma.usageEvent.count({
                where: __assign(__assign({}, where), {
                  eventType: LifecycleEventType.BILLING_SUBSCRIPTION_CANCELED,
                }),
              }),
            ]),
          ];
        case 1:
          ((_a = _b.sent()),
            (signups = _a[0]),
            (tenantsCreated = _a[1]),
            (providersConnected = _a[2]),
            (firstRecons = _a[3]),
            (exceptionsCreated = _a[4]),
            (exceptionsResolved = _a[5]),
            (checkoutsStarted = _a[6]),
            (checkoutsCompleted = _a[7]),
            (paymentsFailed = _a[8]),
            (subscriptionsCanceled = _a[9]));
          conversionRates = {
            signupToConnect: signups > 0 ? (providersConnected / signups) * 100 : 0,
            connectToRecon: providersConnected > 0 ? (firstRecons / providersConnected) * 100 : 0,
            reconToResolved:
              exceptionsCreated > 0 ? (exceptionsResolved / exceptionsCreated) * 100 : 0,
            checkoutToCompleted:
              checkoutsStarted > 0 ? (checkoutsCompleted / checkoutsStarted) * 100 : 0,
          };
          return [
            2 /*return*/,
            {
              signups: signups,
              tenantsCreated: tenantsCreated,
              providersConnected: providersConnected,
              firstRecons: firstRecons,
              exceptionsCreated: exceptionsCreated,
              exceptionsResolved: exceptionsResolved,
              checkoutsStarted: checkoutsStarted,
              checkoutsCompleted: checkoutsCompleted,
              paymentsFailed: paymentsFailed,
              subscriptionsCanceled: subscriptionsCanceled,
              conversionRates: conversionRates,
            },
          ];
      }
    });
  });
}
