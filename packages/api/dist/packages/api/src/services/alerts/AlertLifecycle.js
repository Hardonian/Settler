"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertTransitionError = void 0;
exports.assertCanResolveAlert = assertCanResolveAlert;
class AlertTransitionError extends Error {
    currentState;
    attemptedAction;
    code = "INVALID_ALERT_TRANSITION";
    constructor(message, currentState, attemptedAction) {
        super(message);
        this.currentState = currentState;
        this.attemptedAction = attemptedAction;
        this.name = "AlertTransitionError";
    }
}
exports.AlertTransitionError = AlertTransitionError;
function assertCanResolveAlert(state) {
    if (state !== "open") {
        throw new AlertTransitionError(`Cannot resolve alert from state ${state}`, state, "resolve");
    }
}
//# sourceMappingURL=AlertLifecycle.js.map