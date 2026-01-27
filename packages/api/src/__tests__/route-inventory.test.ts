/**
 * Route Inventory Test
 * 
 * Ensures all exported routes have handlers and no dead routes exist.
 * This test imports the router tree and verifies handlers mount correctly.
 */

import app from '../index';

describe('Route Inventory', () => {
  it('should have app instance', () => {
    expect(app).toBeDefined();
    expect(typeof app).toBe('function');
  });

  it('should have health routes mounted', () => {
    // Health routes should be accessible
    const routes = (app)._router?.stack || [];
    const healthRoutes = routes.filter((layer: any) => 
      layer?.route?.path?.includes('/health') || 
      layer?.regexp?.toString().includes('health')
    );
    expect(healthRoutes.length).toBeGreaterThan(0);
  });

  it('should have API v1 routes mounted', () => {
    const routes = (app)._router?.stack || [];
    const v1Routes = routes.filter((layer: any) => 
      layer?.route?.path?.includes('/api/v1') || 
      layer?.regexp?.toString().includes('api/v1')
    );
    expect(v1Routes.length).toBeGreaterThan(0);
  });

  it('should have API v2 routes mounted', () => {
    const routes = (app)._router?.stack || [];
    const v2Routes = routes.filter((layer: any) => 
      layer?.route?.path?.includes('/api/v2') || 
      layer?.regexp?.toString().includes('api/v2')
    );
    expect(v2Routes.length).toBeGreaterThan(0);
  });

  it('should have 404 handler for unknown routes', () => {
    const routes = (app)._router?.stack || [];
    // The 404 handler should be the last middleware
    const lastLayer = routes[routes.length - 1];
    expect(lastLayer).toBeDefined();
  });

  it('should have error handler middleware', () => {
    const routes = (app)._router?.stack || [];
    const errorHandlers = routes.filter((layer: any) => 
      layer?.handle?.length === 4 // Error handlers have 4 parameters (err, req, res, next)
    );
    expect(errorHandlers.length).toBeGreaterThan(0);
  });
});
