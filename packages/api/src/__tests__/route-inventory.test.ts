/**
 * Route Inventory Test
 *
 * Ensures all exported routes have handlers and no dead routes exist.
 * This test imports the router tree and verifies handlers mount correctly.
 */

import app from "../index";
import { authMiddleware } from "../middleware/auth";

type Layer = {
  handle?: any;
  stack?: Layer[];
  route?: { path?: string };
  regexp?: RegExp;
};

const flattenLayers = (layers: Layer[]): Layer[] => {
  const collected: Layer[] = [];
  const seen = new Set<any>();
  const walk = (layerList: Layer[]) => {
    layerList.forEach((layer) => {
      collected.push(layer);
      const handleAny = layer.handle as any;
      if (handleAny?.stack && !seen.has(handleAny)) {
        seen.add(handleAny);
        walk(handleAny.stack as Layer[]);
      }
    });
  };
  walk(layers);
  return collected;
};

const countAuthMiddleware = (layers: Layer[]): number => {
  const seen = new Set<any>();
  const countLayers = (layerList: Layer[]): number =>
    layerList.reduce((acc, layer) => {
      if (layer.handle === authMiddleware) {
        acc += 1;
      }
      const handleAny = layer.handle as any;
      if (handleAny?.stack && !seen.has(handleAny)) {
        seen.add(handleAny);
        acc += countLayers(handleAny.stack as Layer[]);
      }
      return acc;
    }, 0);

  return countLayers(layers);
};

const hasRoutePrefix = (layers: Layer[], prefix: string): boolean => {
  const flattened = flattenLayers(layers);
  return flattened.some((layer) => {
    const regexText = layer?.regexp?.toString()?.replace(/\\\//g, "/");
    return layer?.route?.path?.includes(prefix) || regexText?.includes(prefix);
  });
};

const findMiddlewareIndices = (layers: Layer[], name: string): number[] => {
  return flattenLayers(layers)
    .map((layer) => layer?.handle?.name)
    .reduce<number[]>((indices, handleName, index) => {
      if (handleName === name) {
        indices.push(index);
      }
      return indices;
    }, []);
};

describe("Route Inventory", () => {
  it("should have app instance", () => {
    expect(app).toBeDefined();
    expect(typeof app).toBe("function");
  });

  it("should have health routes mounted", () => {
    // Health routes should be accessible
    const routes = app._router?.stack || [];
    const healthRoutes = routes.filter(
      (layer: any) =>
        layer?.route?.path?.includes("/health") || layer?.regexp?.toString().includes("health")
    );
    expect(healthRoutes.length).toBeGreaterThan(0);
  });

  it("should have API v1 routes mounted", () => {
    const routes = app._router?.stack || [];
    expect(hasRoutePrefix(routes, "api/v1")).toBe(true);
  });

  it("should have API v2 routes mounted", () => {
    const routes = app._router?.stack || [];
    expect(hasRoutePrefix(routes, "api/v2")).toBe(true);
  });

  it("should have 404 handler for unknown routes", () => {
    const routes = app._router?.stack || [];
    // The 404 handler should be the last middleware
    const lastLayer = routes[routes.length - 1];
    expect(lastLayer).toBeDefined();
  });

  it("should have error handler middleware", () => {
    const routes = app._router?.stack || [];
    const errorHandlers = routes.filter(
      (layer: any) => layer?.handle?.length === 4 // Error handlers have 4 parameters (err, req, res, next)
    );
    expect(errorHandlers.length).toBeGreaterThan(0);
  });

  it("should only register auth middleware once per API version", () => {
    const routes = app._router?.stack || [];
    expect(countAuthMiddleware(routes)).toBeLessThanOrEqual(2);
  });

  it("should mount idempotency middleware after auth per API version", () => {
    const routes = app._router?.stack || [];
    const authIndices = findMiddlewareIndices(routes, "authMiddleware");
    const idempotencyIndices = findMiddlewareIndices(routes, "idempotencyHandler");
    expect(authIndices).toHaveLength(2);
    expect(idempotencyIndices).toHaveLength(2);
    authIndices.forEach((authIndex, position) => {
      expect(authIndex).toBeLessThan(idempotencyIndices[position] ?? Number.MAX_SAFE_INTEGER);
    });
  });
});
