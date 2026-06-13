import { Router } from 'express';
import mongoose from 'mongoose';
import { validateObjectId, validateRequestBody, isValidString, isValidEnum } from '../middleware/security.js';
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

router.get('/', validateObjectId('citizenId'), showAllProperties);

router.post('/',
    validateRequestBody(PROPERTY_ALLOWED_FIELDS, PROPERTY_REQUIRED_FIELDS, PROPERTY_VALIDATORS),
    createProperty
);

router.put('/:id',
    validateObjectId('id'),
    validateRequestBody(PROPERTY_ALLOWED_FIELDS, [], PROPERTY_VALIDATORS),
    updateProperty
);

router.delete('/:id',
    validateObjectId('id'),
    deleteProperty
);

export default router;
