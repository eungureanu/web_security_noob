import { Router } from 'express';
import { showAllNews, createNews, updateNews, deleteNews } from '../controllers/news.controller.js';

const router = Router();

router.get('/', showAllNews);
router.post('/', createNews);
router.put('/:id', updateNews);
router.delete('/:id', deleteNews);

export default router;