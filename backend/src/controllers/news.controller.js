import { News } from '../models/news.model.js';

export async function showAllNews(req, res, next) {
    try {
        const { limit, skip } = req.pagination;

        const [items, total] = await Promise.all([
            News.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('title content author createdAt'),
            News.countDocuments({})
        ]);

        res.json({
            data: items,
            pagination: {
                page: req.pagination.page,
                limit,
                total, 
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        next(err);
    }
}

export async function createNews(req, res, next) {
    try {
        const { title, content, author } = req.body;
        
        if (!title || !content || !author) {
            return res.status(400).json({ error: 'Title, content, and author are required.' });
        }

        const news = new News({ title, content, author });
        await news.save();
        
        res.status(201).json({ data: news });
    } catch (err) {
        next(err);
    }
}

export async function updateNews(req, res, next) {
    try {
        const { id } = req.params;
        const { title, content, author } = req.body;

        const news = await News.findByIdAndUpdate(
            id,
            { title, content, author },
            { new: true, runValidators: true }
        );

        if (!news) {
            return res.status(404).json({ error: 'News item not found.' });
        }

        res.json({ data: news });
    } catch (err) {
        next(err);
    }
}

export async function deleteNews(req, res, next) {
    try {
        const { id } = req.params;
        
        const news = await News.findByIdAndDelete(id);

        if (!news) {
            return res.status(404).json({ error: 'News item not found.' });
        }

        res.json({ message: 'News item deleted successfully.' });
    } catch (err) {
        next(err);
    }
}