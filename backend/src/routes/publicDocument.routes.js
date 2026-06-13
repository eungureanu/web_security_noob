import { Router } from 'express';
import { validateObjectId, validateRequestBody, isValidString } from '../middleware/security.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { showAllPublicDocuments, createPublicDocument, updatePublicDocument, deletePublicDocument } from '../controllers/publicDocument.controller.js';

const router = Router();

const DOCUMENT_ALLOWED_FIELDS = ['title', 'description', 'category', 'fileUrl', 'uploadedBy'];
const DOCUMENT_REQUIRED_FIELDS = ['title', 'category', 'fileUrl', 'uploadedBy'];
const DOCUMENT_VALIDATORS = {
    title: (v) => isValidString(v, 200),
    description: (v) => !v || isValidString(v, 1000),
    category: (v) => isValidString(v, 100) && /^[a-zA-Z0-9\s-]+$/.test(v),
    fileUrl: (v) => isValidString(v, 500),
    uploadedBy: (v) => isValidString(v, 100)
};

// Public: anyone can read public documents
router.get('/', showAllPublicDocuments);

// Only employees can create/edit/delete public documents
router.post('/',
    requireAuth,
    requireRole('registry', 'taxes', 'super_admin'),
    validateRequestBody(DOCUMENT_ALLOWED_FIELDS, DOCUMENT_REQUIRED_FIELDS, DOCUMENT_VALIDATORS),
    createPublicDocument
);

router.put('/:id',
    requireAuth,
    requireRole('registry', 'taxes', 'super_admin'),
    validateObjectId('id'),
    validateRequestBody(DOCUMENT_ALLOWED_FIELDS, [], DOCUMENT_VALIDATORS),
    updatePublicDocument
);

router.delete('/:id',
    requireAuth,
    requireRole('registry', 'taxes', 'super_admin'),
    validateObjectId('id'),
    deletePublicDocument
);

export default router;
