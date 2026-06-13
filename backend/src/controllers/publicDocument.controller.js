import { PublicDocument } from '../models/publicDocument.model.js';

export async function showAllPublicDocuments(req, res, next) {
    try {
        const { limit, skip } = req.pagination;
        const { category } = req.query;

        const filter = {};
        if (category && typeof category === 'string' && /^[a-zA-Z0-9\s-]+$/.test(category)) {
            filter.category = category;
        }

        const [items, total] = await Promise.all([
            PublicDocument.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('title description category fileUrl'),
            PublicDocument.countDocuments(filter)
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