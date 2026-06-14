import { Tax } from '../models/tax.model.js';

export async function showAllTaxes(req, res, next) {
    try {
        const { limit, skip } = req.pagination;
        const { citizenId } = req.query;
        const user = req.user;

        let filter = {};

        // Citizens can only see their own taxes
        if (user.role === 'citizen') {
            filter = { citizenId: user.citizenId };
        } else if (citizenId) {
            // Employees can filter by citizenId if provided
            filter = { citizenId };
        }

        const [items, total] = await Promise.all([
            Tax.find(filter)
                .sort({ dueDate: -1 })
                .skip(skip)
                .limit(limit)
                .select('citizenId propertyId title amount dueDate status'),
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
        const { citizenId, propertyId, title, amount, dueDate, status } = req.sanitizedBody;
        
        const tax = new Tax({ 
            citizenId, 
            propertyId: propertyId || null, 
            title, 
            amount, 
            dueDate, 
            status: status || 'pending' 
        });
        const saved = await tax.save();
        
        console.log(`[CREATE] Tax item created with ID ${saved._id} from IP ${req.ip}`);
        
        res.status(201).json({
            data: {
                _id: saved._id,
                citizenId: saved.citizenId,
                propertyId: saved.propertyId,
                title: saved.title,
                amount: saved.amount,
                dueDate: saved.dueDate,
                status: saved.status
            }
        });
    } catch (err) {
        next(err);
    }
}

export async function updateTax(req, res, next) {
    try {
        const { id } = req.params;
        const updateData = req.sanitizedBody;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update.' });
        }
        
        const updated = await Tax.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('citizenId propertyId title amount dueDate status');
        
        if (!updated) {
            return res.status(404).json({ error: 'Resource not found.' });
        }
        
        console.log(`[UPDATE] Tax item ${id} updated from IP ${req.ip}`);
        
        res.json({ data: updated });
    } catch (err) {
        next(err);
    }
}

export async function deleteTax(req, res, next) {
    try {
        const { id } = req.params;
        
        const deleted = await Tax.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Resource not found.' });
        }
        
        console.log(`[DELETE] Tax item ${id} deleted from IP ${req.ip}`);
        
        res.json({ message: 'Resource deleted successfully.' });
    } catch (err) {
        next(err);
    }
}
