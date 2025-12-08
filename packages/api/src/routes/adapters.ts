import { Router, Request, Response } from "express";
import { get, set } from "../utils/cache";
import { handleRouteError } from "../utils/error-handler";
import { listAdapters, getAdapterConfigSchema } from "../utils/adapter-config-validator";

const router = Router();

// Get adapters from validator (UX-002)
const ADAPTERS = listAdapters().map(adapter => ({
  id: adapter.id,
  name: adapter.name,
  description: `Reconcile ${adapter.name} transactions`,
  version: "1.0.0",
  config: {
    required: adapter.configSchema.required,
    optional: adapter.configSchema.optional || [],
    fields: adapter.configSchema.fields,
  },
  supportedEvents: adapter.id === 'stripe' 
    ? ["payment.succeeded", "charge.refunded"]
    : adapter.id === 'shopify'
    ? ["order.created", "order.updated", "transaction.created"]
    : adapter.id === 'quickbooks'
    ? ["transaction.created", "transaction.updated"]
    : adapter.id === 'paypal'
    ? ["payment.completed", "refund.completed"]
    : [],
}));

// List available adapters (cached)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'adapters:list';
    const cached = await get<typeof ADAPTERS>(cacheKey);

    if (cached) {
      res.json({
        data: cached,
        count: cached.length,
      });
      return;
    }

    // Cache for 1 hour
    await set(cacheKey, ADAPTERS, 3600);

    res.json({
      data: ADAPTERS,
      count: ADAPTERS.length,
    });
  } catch (error: unknown) {
    handleRouteError(res, error, "Failed to fetch adapters", 500);
  }
});

// Get adapter details (UX-002: Enhanced with schema)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        error: "Bad Request",
        message: "Adapter ID required",
      });
      return;
    }
    
    const schema = getAdapterConfigSchema(id);
    if (!schema) {
      res.status(404).json({
        error: "Not Found",
        message: `Adapter '${id}' not found`,
      });
      return;
    }

    const adapter = {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      description: `Adapter for ${id}`,
      version: "1.0.0",
      config: {
        required: schema.required,
        optional: schema.optional || [],
        fields: schema.fields,
      },
      documentation: `https://docs.settler.io/adapters/${id}`,
    };

    res.json({ data: adapter });
  } catch (error: unknown) {
    handleRouteError(res, error, "Failed to fetch adapter", 500);
  }
});

export { router as adaptersRouter };
