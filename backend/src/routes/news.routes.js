import { Router } from 'express';
import { validateObjectId, validateRequestBody, isValidString } from '../middleware/security.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { showAllNews, createNews, updateNews, deleteNews } from '../controllers/news.controller.js';

const router = Router();

const NEWS_ALLOWED_FIELDS = ['title', 'content', 'author'];
const NEWS_REQUIRED_FIELDS = ['title', 'content', 'author'];
const NEWS_VALIDATORS = {
    title: (v) => isValidString(v, 200),
    content: (v) => isValidString(v, 5000),
    author: (v) => isValidString(v, 100)
};

// Public: anyone can read news
router.get('/', showAllNews);

// Only employees can create/edit/delete news
router.post('/', 
    requireAuth,
    requireRole('registry', 'taxes', 'super_admin'),
    validateRequestBody(NEWS_ALLOWED_FIELDS, NEWS_REQUIRED_FIELDS, NEWS_VALIDATORS),
    createNews
);

router.put('/:id',
    requireAuth,
    requireRole('registry', 'taxes', 'super_admin'),
    validateObjectId('id'),
    validateRequestBody(NEWS_ALLOWED_FIELDS, [], NEWS_VALIDATORS),
    updateNews
);

router.delete('/:id',
    requireAuth,
    requireRole('registry', 'taxes', 'super_admin'),
    validateObjectId('id'),
    deleteNews
);

export default router;
