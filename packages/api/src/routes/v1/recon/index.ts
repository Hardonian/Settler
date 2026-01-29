/**
 * Recon Core API Routes
 * 
 * Unified API for Recon Core Engine
 * Part of Phase I: Recon Core Foundation
 */

import { Router } from 'express';
import jobsRouter from './jobs';
import resultsRouter from './results';

const router: Router = Router();

// Mount sub-routers
router.use('/jobs', jobsRouter);
router.use('/jobs/:jobId/results', resultsRouter);
router.use('/results', resultsRouter);

export default router;
