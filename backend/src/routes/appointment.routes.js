import { Router } from 'express';
import mongoose from 'mongoose';
import { validateObjectId, validateRequestBody, isValidString, isValidDate, isValidEnum } from '../middleware/security.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { showAllAppointments, createAppointment, updateAppointment, deleteAppointment } from '../controllers/appointment.controller.js';

const router = Router();

const APPOINTMENT_ALLOWED_FIELDS = ['citizenId', 'department', 'date', 'purpose', 'status'];
const APPOINTMENT_REQUIRED_FIELDS = ['citizenId', 'department', 'date', 'purpose'];
const APPOINTMENT_VALIDATORS = {
    citizenId: (v) => mongoose.Types.ObjectId.isValid(v),
    department: (v) => isValidString(v, 200),
    date: (v) => isValidDate(v),
    purpose: (v) => isValidString(v, 500),
    status: (v) => isValidEnum(v, ['scheduled', 'completed', 'cancelled'])
};

// Authenticated users can read appointments (citizens see only their own)
router.get('/', requireAuth, validateObjectId('citizenId'), showAllAppointments);

// Citizens can create their own appointments; registry + super_admin can create for anyone
router.post('/',
    requireAuth,
    validateRequestBody(APPOINTMENT_ALLOWED_FIELDS, APPOINTMENT_REQUIRED_FIELDS, APPOINTMENT_VALIDATORS),
    createAppointment
);

// Citizens can edit their own appointments; registry + super_admin can edit any
router.put('/:id',
    requireAuth,
    validateObjectId('id'),
    validateRequestBody(APPOINTMENT_ALLOWED_FIELDS, [], APPOINTMENT_VALIDATORS),
    updateAppointment
);

// Citizens can delete their own appointments; registry + super_admin can delete any
router.delete('/:id',
    requireAuth,
    validateObjectId('id'),
    deleteAppointment
);

export default router;
