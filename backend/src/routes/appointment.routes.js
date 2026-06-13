import { Router } from 'express';
import { validateObjectId } from '../middleware/security.js';
import { showAllAppointments } from '../controllers/appointment.controller.js';

const router = Router();

// the validateObjectId middleware method is applied per route where the citizenId is expected in the URL path or query string
router.get('/', validateObjectId('citizenId'), showAllAppointments);

export default router;