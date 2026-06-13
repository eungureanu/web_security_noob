import { Router } from 'express';
import mongoose from 'mongoose';
import { validateObjectId, validateRequestBody, isValidString, isValidDate, isValidEnum } from '../middleware/security.js';
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

router.get('/', validateObjectId('citizenId'), showAllAppointments);

router.post('/',
    validateRequestBody(APPOINTMENT_ALLOWED_FIELDS, APPOINTMENT_REQUIRED_FIELDS, APPOINTMENT_VALIDATORS),
    createAppointment
);

router.put('/:id',
    validateObjectId('id'),
    validateRequestBody(APPOINTMENT_ALLOWED_FIELDS, [], APPOINTMENT_VALIDATORS),
    updateAppointment
);

router.delete('/:id',
    validateObjectId('id'),
    deleteAppointment
);

export default router;
