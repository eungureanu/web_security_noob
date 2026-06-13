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
                .select('title description category fileUrl uploadedBy'),
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
        const { title, description, category, fileUrl, uploadedBy } = req.sanitizedBody;
        
        const document = new PublicDocument({ 
            title, 
            description: description || null, 
            category, 
            fileUrl, 
            uploadedBy 
        });
        const saved = await document.save();
        
        console.log(`[CREATE] PublicDocument created with ID ${saved._id} from IP ${req.ip}`);
        
        res.status(201).json({
            data: {
                _id: saved._id,
                title: saved.title,
                description: saved.description,
                category: saved.category,
                fileUrl: saved.fileUrl,
                uploadedBy: saved.uploadedBy
            }
        });
    } catch (err) {
        next(err);
    }
}

export async function updatePublicDocument(req, res, next) {
    try {
        const { id } = req.params;
        const updateData = req.sanitizedBody;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update.' });
        }
        
        const updated = await PublicDocument.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('title description category fileUrl uploadedBy');
        
        if (!updated) {
            return res.status(404).json({ error: 'Resource not found.' });
        }
        
        console.log(`[UPDATE] PublicDocument ${id} updated from IP ${req.ip}`);
        
        res.json({ data: updated });
    } catch (err) {
        next(err);
    }
}

export async function deletePublicDocument(req, res, next) {
    try {
        const { id } = req.params;
        
        const deleted = await PublicDocument.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Resource not found.' });
        }
        
        console.log(`[DELETE] PublicDocument ${id} deleted from IP ${req.ip}`);
        
        res.json({ message: 'Resource deleted successfully.' });
    } catch (err) {
        next(err);
    }
}
