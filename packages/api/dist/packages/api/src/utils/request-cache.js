"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestCache = getRequestCache;
exports.memoizeRequestValue = memoizeRequestValue;
const requestCacheSymbol = Symbol("requestCache");
function getRequestCache(req) {
    const reqWithCache = req;
    if (!reqWithCache[requestCacheSymbol]) {
        reqWithCache[requestCacheSymbol] = new Map();
    }
    return reqWithCache[requestCacheSymbol];
}
async function memoizeRequestValue(req, key, factory) {
    const cache = getRequestCache(req);
    if (cache.has(key)) {
        return cache.get(key);
    }
    const value = await factory();
    cache.set(key, value);
    return value;
}
//# sourceMappingURL=request-cache.js.map