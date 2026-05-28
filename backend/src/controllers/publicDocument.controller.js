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

export async function createPublicDocument(req, res, next) {
    try {
        const { title, description, category, fileUrl, uploadedBy } = req.body;
        
        if (!title || !category || !fileUrl || !uploadedBy) {
            return res.status(400).json({ error: 'Title, category, fileUrl, and uploadedBy are required.' });
        }

        const publicDocument = new PublicDocument({ title, description, category, fileUrl, uploadedBy });
        await publicDocument.save();
        
        res.status(201).json({ data: publicDocument });
    } catch (err) {
        next(err);
    }
}

export async function updatePublicDocument(req, res, next) {
    try {
        const { id } = req.params;
        const { title, description, category, fileUrl, uploadedBy } = req.body;

        const publicDocument = await PublicDocument.findByIdAndUpdate(
            id,
            { title, description, category, fileUrl, uploadedBy },
            { new: true, runValidators: true }
        );

        if (!publicDocument) {
            return res.status(404).json({ error: 'Public document not found.' });
        }

        res.json({ data: publicDocument });
    } catch (err) {
        next(err);
    }
}

export async function deletePublicDocument(req, res, next) {
    try {
        const { id } = req.params;
        
        const publicDocument = await PublicDocument.findByIdAndDelete(id);

        if (!publicDocument) {
            return res.status(404).json({ error: 'Public document not found.' });
        }

        res.json({ message: 'Public document deleted successfully.' });
    } catch (err) {
        next(err);
    }
}