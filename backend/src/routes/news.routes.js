import { Router } from 'express';
import { showAllNews } from '../controllers/news.controller.js';

const router = Router();

router.get('/', showAllNews);

export default router;