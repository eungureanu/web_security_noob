import { Router } from 'express';
import { validateObjectId } from '../middleware/security.js';
import { showAllRequests, createRequest, updateRequest, deleteRequest } from '../controllers/request.controller.js';

const router = Router();

router.get('/', validateObjectId('citizenId'), showAllRequests);
router.post('/', createRequest);
router.put('/:id', updateRequest);
router.delete('/:id', deleteRequest);

export default router;