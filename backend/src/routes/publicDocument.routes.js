import { Router } from 'express';
import { showAllPublicDocuments, createPublicDocument, updatePublicDocument, deletePublicDocument } from '../controllers/publicDocument.controller.js';

const router = Router();

router.get('/', showAllPublicDocuments);
router.post('/', createPublicDocument);
router.put('/:id', updatePublicDocument);
router.delete('/:id', deletePublicDocument);

export default router;