import { Property } from '../models/property.model.js';

export async function showAllProperties(req, res, next) {
    try {
        const { limit, skip } = req.pagination;
        const { citizenId } = req.query;

        const filter = citizenId ? { citizenId } : {};

        const [items, total] = await Promise.all([
            Property.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('citizenId address propertyType details'),
            Property.countDocuments(filter)
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

export async function createProperty(req, res, next) {
    try {
        const { citizenId, address, propertyType, details } = req.sanitizedBody;
        
        const property = new Property({ 
            citizenId, 
            address, 
            propertyType, 
            details: details || undefined 
        });
        const saved = await property.save();
        
        console.log(`[CREATE] Property created with ID ${saved._id} from IP ${req.ip}`);
        
        res.status(201).json({
            data: {
                _id: saved._id,
                citizenId: saved.citizenId,
                address: saved.address,
                propertyType: saved.propertyType,
                details: saved.details
            }
        });
    } catch (err) {
        next(err);
    }
}

export async function updateProperty(req, res, next) {
    try {
        const { id } = req.params;
        const updateData = req.sanitizedBody;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update.' });
        }
        
        const updated = await Property.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('citizenId address propertyType details');
        
        if (!updated) {
            return res.status(404).json({ error: 'Resource not found.' });
        }
        
        console.log(`[UPDATE] Property ${id} updated from IP ${req.ip}`);
        
        res.json({ data: updated });
    } catch (err) {
        next(err);
    }
}

export async function deleteProperty(req, res, next) {
    try {
        const { id } = req.params;
        
        const deleted = await Property.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Resource not found.' });
        }
        
        console.log(`[DELETE] Property ${id} deleted from IP ${req.ip}`);
        
        res.json({ message: 'Resource deleted successfully.' });
    } catch (err) {
        next(err);
    }
}
