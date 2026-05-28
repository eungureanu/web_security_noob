import { Router } from 'express';
import { showAllPublicDocuments } from '../controllers/publicDocument.controller.js';

const router = Router();

router.get('/', showAllPublicDocuments);

export default router;