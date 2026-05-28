import { Router } from 'express';
import { showAllCitizens } from '../controllers/citizen.controller.js';

const router = Router();

router.get('/', showAllCitizens);

export default router;