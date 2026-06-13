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
                .select('citizenId documentType proofFiles status adminComment legalResponseDays createdAt'),
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
        const { citizenId, documentType, proofFiles, status, adminComment, legalResponseDays } = req.sanitizedBody;
        
        const request = new Request({ 
            citizenId, 
            documentType, 
            proofFiles: proofFiles || [], 
            status: status || 'pending',
            adminComment: adminComment || null,
            legalResponseDays 
        });
        const saved = await request.save();
        
        console.log(`[CREATE] Request created with ID ${saved._id} from IP ${req.ip}`);
        
        res.status(201).json({
            data: {
                _id: saved._id,
                citizenId: saved.citizenId,
                documentType: saved.documentType,
                proofFiles: saved.proofFiles,
                status: saved.status,
                adminComment: saved.adminComment,
                legalResponseDays: saved.legalResponseDays,
                createdAt: saved.createdAt
            }
        });
    } catch (err) {
        next(err);
    }
}

export async function updateRequest(req, res, next) {
    try {
        const { id } = req.params;
        const updateData = req.sanitizedBody;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update.' });
        }
        
        const updated = await Request.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('citizenId documentType proofFiles status adminComment legalResponseDays createdAt');
        
        if (!updated) {
            return res.status(404).json({ error: 'Resource not found.' });
        }
        
        console.log(`[UPDATE] Request ${id} updated from IP ${req.ip}`);
        
        res.json({ data: updated });
    } catch (err) {
        next(err);
    }
}

export async function deleteRequest(req, res, next) {
    try {
        const { id } = req.params;
        
        const deleted = await Request.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Resource not found.' });
        }
        
        console.log(`[DELETE] Request ${id} deleted from IP ${req.ip}`);
        
        res.json({ message: 'Resource deleted successfully.' });
    } catch (err) {
        next(err);
    }
}
