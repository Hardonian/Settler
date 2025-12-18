/**
 * Webhook Events API
 * 
 * Endpoints for discovering available webhook events
 */

import { Router, Response } from 'express';
import { AuthRequest } from '../../../middleware/auth';
import { getPublicEvents, getEventMetadata, isValidEventType } from '../../../services/webhooks/event-registry';

const router = Router();

/**
 * GET /api/v1/webhooks/events
 * List all available webhook events
 */
router.get('/events', async (_req: AuthRequest, res: Response) => {
  const events = getPublicEvents();
  
  res.json({
    data: events.map(event => ({
      type: event.type,
      description: event.description,
      schema: event.schema,
      since: event.since,
      deprecated: event.deprecated,
    })),
    count: events.length,
  });
});

/**
 * GET /api/v1/webhooks/events/:eventType
 * Get details for a specific event type
 */
router.get('/events/:eventType', async (req: AuthRequest, res: Response): Promise<void> => {
  const { eventType } = req.params;
  
  if (!eventType || !isValidEventType(eventType)) {
    res.status(400).json({
      error: 'INVALID_EVENT_TYPE',
      message: `Unknown event type: ${eventType || 'undefined'}`,
    });
    return;
  }
  
  const metadata = getEventMetadata(eventType);
  if (!metadata) {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: `Event type not found: ${eventType}`,
    });
    return;
  }
  
  if (!metadata.public) {
    res.status(403).json({
      error: 'FORBIDDEN',
      message: 'This event type is not available for public subscription',
    });
    return;
  }
  
  res.json({
    data: {
      type: metadata.type,
      description: metadata.description,
      schema: metadata.schema,
      since: metadata.since,
      deprecated: metadata.deprecated,
    },
  });
});

export default router;
