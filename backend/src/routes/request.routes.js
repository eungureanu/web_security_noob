import { Router } from 'express';
import mongoose from 'mongoose';
import { validateObjectId, validateRequestBody, isValidString, isValidPositiveNumber, isValidEnum } from '../middleware/security.js';
import { showAllRequests, createRequest, updateRequest, deleteRequest } from '../controllers/request.controller.js';

const router = Router();

const REQUEST_ALLOWED_FIELDS = ['citizenId', 'documentType', 'proofFiles', 'status', 'adminComment', 'legalResponseDays'];
const REQUEST_REQUIRED_FIELDS = ['citizenId', 'documentType', 'legalResponseDays'];
const REQUEST_VALIDATORS = {
    citizenId: (v) => mongoose.Types.ObjectId.isValid(v),
    documentType: (v) => isValidString(v, 200),
    proofFiles: (v) => !v || (Array.isArray(v) && v.every(f => isValidString(f, 500))),
    status: (v) => isValidEnum(v, ['pending', 'approved', 'rejected']),
    adminComment: (v) => !v || isValidString(v, 1000),
    legalResponseDays: (v) => isValidPositiveNumber(v) && v >= 1
};

router.get('/', validateObjectId('citizenId'), showAllRequests);

router.post('/',
    validateRequestBody(REQUEST_ALLOWED_FIELDS, REQUEST_REQUIRED_FIELDS, REQUEST_VALIDATORS),
    createRequest
);

router.put('/:id',
    validateObjectId('id'),
    validateRequestBody(REQUEST_ALLOWED_FIELDS, [], REQUEST_VALIDATORS),
    updateRequest
);

router.delete('/:id',
    validateObjectId('id'),
    deleteRequest
);

export default router;
