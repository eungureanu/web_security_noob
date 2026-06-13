import { Router } from 'express';
import mongoose from 'mongoose';
import { validateObjectId, validateRequestBody, isValidString, isValidPositiveNumber, isValidDate, isValidEnum } from '../middleware/security.js';
import { showAllTaxes, createTax, updateTax, deleteTax } from '../controllers/tax.controller.js';

const router = Router();

const TAX_ALLOWED_FIELDS = ['citizenId', 'propertyId', 'title', 'amount', 'dueDate', 'status'];
const TAX_REQUIRED_FIELDS = ['citizenId', 'title', 'amount', 'dueDate'];
const TAX_VALIDATORS = {
    citizenId: (v) => mongoose.Types.ObjectId.isValid(v),
    propertyId: (v) => !v || mongoose.Types.ObjectId.isValid(v),
    title: (v) => isValidString(v, 200),
    amount: (v) => isValidPositiveNumber(v),
    dueDate: (v) => isValidDate(v),
    status: (v) => isValidEnum(v, ['pending', 'paid'])
};

router.get('/', validateObjectId('citizenId'), showAllTaxes);

router.post('/',
    validateRequestBody(TAX_ALLOWED_FIELDS, TAX_REQUIRED_FIELDS, TAX_VALIDATORS),
    createTax
);

router.put('/:id',
    validateObjectId('id'),
    validateRequestBody(TAX_ALLOWED_FIELDS, [], TAX_VALIDATORS),
    updateTax
);

router.delete('/:id',
    validateObjectId('id'),
    deleteTax
);

export default router;
