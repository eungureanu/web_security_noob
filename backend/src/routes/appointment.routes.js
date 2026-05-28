import { Router } from 'express';
import { validateObjectId } from '../middleware/security.js';
import { showAllAppointments, createAppointment, updateAppointment, deleteAppointment } from '../controllers/appointment.controller.js';

const router = Router();

router.get('/', validateObjectId('citizenId'), showAllAppointments);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;