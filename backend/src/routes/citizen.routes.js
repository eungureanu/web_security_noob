import { Router } from 'express';
import { showAllCitizens, createCitizen, updateCitizen, deleteCitizen } from '../controllers/citizen.controller.js';

const router = Router();

router.get('/', showAllCitizens);
router.post('/', createCitizen);
router.put('/:id', updateCitizen);
router.delete('/:id', deleteCitizen);

export default router;