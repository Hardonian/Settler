/**
 * Pricing API Routes
 * 
 * Part of Section 9: Pricing Intelligence
 */

import { Router } from 'express';
import simulatorRouter from './simulator';

const router: Router = Router();

router.use('/simulator', simulatorRouter);

export default router;
