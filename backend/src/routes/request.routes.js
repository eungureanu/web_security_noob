import { Router } from 'express';
import { validateObjectId } from '../middleware/security.js';
import { showAllRequests } from '../controllers/request.controller.js';

const router = Router();

// the validateObjectId middleware method is applied per route where the citizenId is expected in the URL path or query string
router.get('/', validateObjectId('citizenId'), showAllRequests);

export default router;