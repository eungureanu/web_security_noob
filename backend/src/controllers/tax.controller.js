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

export async function createTax(req, res, next) {
    try {
        const { citizenId, propertyId, title, amount, dueDate, status } = req.body;
        
        if (!citizenId || !title || amount === undefined || !dueDate) {
            return res.status(400).json({ error: 'CitizenId, title, amount, and dueDate are required.' });
        }

        const tax = new Tax({ citizenId, propertyId, title, amount, dueDate, status });
        await tax.save();
        
        res.status(201).json({ data: tax });
    } catch (err) {
        next(err);
    }
}

export async function updateTax(req, res, next) {
    try {
        const { id } = req.params;
        const { citizenId, propertyId, title, amount, dueDate, status } = req.body;

        const tax = await Tax.findByIdAndUpdate(
            id,
            { citizenId, propertyId, title, amount, dueDate, status },
            { new: true, runValidators: true }
        );

        if (!tax) {
            return res.status(404).json({ error: 'Tax not found.' });
        }

        res.json({ data: tax });
    } catch (err) {
        next(err);
    }
}

export async function deleteTax(req, res, next) {
    try {
        const { id } = req.params;
        
        const tax = await Tax.findByIdAndDelete(id);

        if (!tax) {
            return res.status(404).json({ error: 'Tax not found.' });
        }

        res.json({ message: 'Tax deleted successfully.' });
    } catch (err) {
        next(err);
    }
}