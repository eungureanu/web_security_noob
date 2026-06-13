import { Tax } from '../models/tax.model.js';

export async function showAllTaxes(req, res, next) {
    try {
        const { limit, skip } = req.pagination;
        const { citizenId } = req.query;

        const filter = citizenId ? { citizenId } : {};

        const [items, total] = await Promise.all([
            Tax.find(filter)
                .sort({ dueDate: -1 })
                .skip(skip)
                .limit(limit)
                .select('title amount dueDate status'),
            Tax.countDocuments(filter)
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