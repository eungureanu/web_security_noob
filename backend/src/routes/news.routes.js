import { Router } from 'express';
import { validateObjectId, validateRequestBody, isValidString } from '../middleware/security.js';
import { showAllNews, createNews, updateNews, deleteNews } from '../controllers/news.controller.js';

const router = Router();

const NEWS_ALLOWED_FIELDS = ['title', 'content', 'author'];
const NEWS_REQUIRED_FIELDS = ['title', 'content', 'author'];
const NEWS_VALIDATORS = {
    title: (v) => isValidString(v, 200),
    content: (v) => isValidString(v, 5000),
    author: (v) => isValidString(v, 100)
};

router.get('/', showAllNews);

router.post('/', 
    validateRequestBody(NEWS_ALLOWED_FIELDS, NEWS_REQUIRED_FIELDS, NEWS_VALIDATORS),
    createNews
);

router.put('/:id',
    validateObjectId('id'),
    validateRequestBody(NEWS_ALLOWED_FIELDS, [], NEWS_VALIDATORS),
    updateNews
);

router.delete('/:id',
    validateObjectId('id'),
    deleteNews
);

export default router;
