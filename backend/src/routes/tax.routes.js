import { Router } from 'express';
import { validateObjectId } from '../middleware/security.js';
import { showAllTaxes, createTax, updateTax, deleteTax } from '../controllers/tax.controller.js';

const router = Router();

router.get('/', validateObjectId('citizenId'), showAllTaxes);
router.post('/', createTax);
router.put('/:id', updateTax);
router.delete('/:id', deleteTax);

export default router;