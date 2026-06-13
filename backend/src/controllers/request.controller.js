import { Request } from '../models/request.model.js';

export async function showAllRequests(req, res, next) {
    try {
        const { limit, skip } = req.pagination;
        const { citizenId } = req.query;

        const filter = citizenId ? { citizenId } : {};

        const [items, total] = await Promise.all([
            Request.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('documentType status adminComment legalResponseDays createdAt'),
            Request.countDocuments(filter)
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

export async function createRequest(req, res, next) {
    try {
        const { citizenId, documentType, proofFiles, status, adminComment, legalResponseDays } = req.body;
        
        if (!citizenId || !documentType || !legalResponseDays) {
            return res.status(400).json({ error: 'CitizenId, documentType, and legalResponseDays are required.' });
        }

        const request = new Request({ citizenId, documentType, proofFiles, status, adminComment, legalResponseDays });
        await request.save();
        
        res.status(201).json({ data: request });
    } catch (err) {
        next(err);
    }
}

export async function updateRequest(req, res, next) {
    try {
        const { id } = req.params;
        const { citizenId, documentType, proofFiles, status, adminComment, legalResponseDays } = req.body;

        const request = await Request.findByIdAndUpdate(
            id,
            { citizenId, documentType, proofFiles, status, adminComment, legalResponseDays },
            { new: true, runValidators: true }
        );

        if (!request) {
            return res.status(404).json({ error: 'Request not found.' });
        }

        res.json({ data: request });
    } catch (err) {
        next(err);
    }
}

export async function deleteRequest(req, res, next) {
    try {
        const { id } = req.params;
        
        const request = await Request.findByIdAndDelete(id);

        if (!request) {
            return res.status(404).json({ error: 'Request not found.' });
        }

        res.json({ message: 'Request deleted successfully.' });
    } catch (err) {
        next(err);
    }
}