import { Router } from 'express';
import { validateObjectId, validateRequestBody, isValidString } from '../middleware/security.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { showAllCitizens, createCitizen, updateCitizen, deleteCitizen, getCitizenById } from '../controllers/citizen.controller.js';

const router = Router();

const CITIZEN_ALLOWED_FIELDS = ['firstName', 'lastName', 'CNP', 'idCardNumber', 'address', 'phone'];
const CITIZEN_REQUIRED_FIELDS = ['firstName', 'lastName', 'CNP', 'idCardNumber', 'address', 'phone'];
const CITIZEN_VALIDATORS = {
    firstName: (v) => isValidString(v, 100),
    lastName: (v) => isValidString(v, 100),
    CNP: (v) => isValidString(v, 13) && /^\d{13}$/.test(v),
    idCardNumber: (v) => isValidString(v, 20),
    address: (v) => isValidString(v, 500),
    phone: (v) => isValidString(v, 20) && /^[\d\s\-\+\(\)]+$/.test(v)
};

// Authenticated users can read citizens list (needed for dropdowns)
// Controller handles filtering based on role
router.get('/', requireAuth, showAllCitizens);

// Get single citizen by ID (citizens can only get their own)
router.get('/:id', requireAuth, validateObjectId('id'), getCitizenById);

// Only super_admin can create new citizens
router.post('/',
    requireAuth,
    requireRole('super_admin'),
    validateRequestBody(CITIZEN_ALLOWED_FIELDS, CITIZEN_REQUIRED_FIELDS, CITIZEN_VALIDATORS),
    createCitizen
);

// Citizens can edit only their own data; super_admin can edit anyone
router.put('/:id',
    requireAuth,
    validateObjectId('id'),
    validateRequestBody(CITIZEN_ALLOWED_FIELDS, [], CITIZEN_VALIDATORS),
    updateCitizen
);

// Only super_admin can delete citizens
router.delete('/:id',
    requireAuth,
    requireRole('super_admin'),
    validateObjectId('id'),
    deleteCitizen
);

export default router;
