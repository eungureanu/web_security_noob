import { Router } from 'express';
import { validateObjectId } from '../middleware/security.js';
import { showAllProperties, createProperty, updateProperty, deleteProperty } from '../controllers/property.controller.js';

const router = Router();

router.get('/', validateObjectId('citizenId'), showAllProperties);
router.post('/', createProperty);
router.put('/:id', updateProperty);
router.delete('/:id', deleteProperty);

export default router;