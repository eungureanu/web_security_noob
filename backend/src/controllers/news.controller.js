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
        const { title, content, author } = req.sanitizedBody;
        
        const news = new News({ title, content, author });
        const saved = await news.save();
        
        console.log(`[CREATE] News item created with ID ${saved._id} from IP ${req.ip}`);
        
        res.status(201).json({
            data: {
                _id: saved._id,
                title: saved.title,
                content: saved.content,
                author: saved.author,
                createdAt: saved.createdAt
            }
        });
    } catch (err) {
        next(err);
    }
}

export async function updateNews(req, res, next) {
    try {
        const { id } = req.params;
        const updateData = req.sanitizedBody;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update.' });
        }
        
        const updated = await News.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('title content author createdAt');
        
        if (!updated) {
            return res.status(404).json({ error: 'Resource not found.' });
        }
        
        console.log(`[UPDATE] News item ${id} updated from IP ${req.ip}`);
        
        res.json({ data: updated });
    } catch (err) {
        next(err);
    }
}

export async function deleteNews(req, res, next) {
    try {
        const { id } = req.params;
        
        const deleted = await News.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Resource not found.' });
        }
        
        console.log(`[DELETE] News item ${id} deleted from IP ${req.ip}`);
        
        res.json({ message: 'Resource deleted successfully.' });
    } catch (err) {
        next(err);
    }
}
