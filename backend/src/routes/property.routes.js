import { Router } from 'express';
import mongoose from 'mongoose';
import { validateObjectId, validateRequestBody, isValidString, isValidEnum } from '../middleware/security.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { showAllProperties, createProperty, updateProperty, deleteProperty } from '../controllers/property.controller.js';

const router = Router();

const PROPERTY_ALLOWED_FIELDS = ['citizenId', 'address', 'propertyType', 'details'];
const PROPERTY_REQUIRED_FIELDS = ['citizenId', 'address', 'propertyType'];
const PROPERTY_VALIDATORS = {
    citizenId: (v) => mongoose.Types.ObjectId.isValid(v),
    address: (v) => isValidString(v, 500),
    propertyType: (v) => isValidEnum(v, ['house', 'land', 'car']),
    details: (v) => !v || isValidString(v, 1000)
};

// Authenticated users can read properties (citizens see only their own)
router.get('/', requireAuth, validateObjectId('citizenId'), showAllProperties);

// Only registry + super_admin can create/edit/delete properties
router.post('/',
    requireAuth,
    requireRole('registry', 'super_admin'),
    validateRequestBody(PROPERTY_ALLOWED_FIELDS, PROPERTY_REQUIRED_FIELDS, PROPERTY_VALIDATORS),
    createProperty
);

router.put('/:id',
    requireAuth,
    requireRole('registry', 'super_admin'),
    validateObjectId('id'),
    validateRequestBody(PROPERTY_ALLOWED_FIELDS, [], PROPERTY_VALIDATORS),
    updateProperty
);

router.delete('/:id',
    requireAuth,
    requireRole('registry', 'super_admin'),
    validateObjectId('id'),
    deleteProperty
);

export default router;
