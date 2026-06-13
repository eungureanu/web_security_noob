import { Router } from 'express';
import { validateObjectId, validateRequestBody, isValidString } from '../middleware/security.js';
import { showAllCitizens, createCitizen, updateCitizen, deleteCitizen } from '../controllers/citizen.controller.js';

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

router.get('/', showAllCitizens);

router.post('/',
    validateRequestBody(CITIZEN_ALLOWED_FIELDS, CITIZEN_REQUIRED_FIELDS, CITIZEN_VALIDATORS),
    createCitizen
);

router.put('/:id',
    validateObjectId('id'),
    validateRequestBody(CITIZEN_ALLOWED_FIELDS, [], CITIZEN_VALIDATORS),
    updateCitizen
);

router.delete('/:id',
    validateObjectId('id'),
    deleteCitizen
);

export default router;
