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
                .select('address propertyType details'),
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
        const { citizenId, address, propertyType, details } = req.body;
        
        if (!citizenId || !address || !propertyType) {
            return res.status(400).json({ error: 'CitizenId, address, and propertyType are required.' });
        }

        const property = new Property({ citizenId, address, propertyType, details });
        await property.save();
        
        res.status(201).json({ data: property });
    } catch (err) {
        next(err);
    }
}

export async function updateProperty(req, res, next) {
    try {
        const { id } = req.params;
        const { citizenId, address, propertyType, details } = req.body;

        const property = await Property.findByIdAndUpdate(
            id,
            { citizenId, address, propertyType, details },
            { new: true, runValidators: true }
        );

        if (!property) {
            return res.status(404).json({ error: 'Property not found.' });
        }

        res.json({ data: property });
    } catch (err) {
        next(err);
    }
}

export async function deleteProperty(req, res, next) {
    try {
        const { id } = req.params;
        
        const property = await Property.findByIdAndDelete(id);

        if (!property) {
            return res.status(404).json({ error: 'Property not found.' });
        }

        res.json({ message: 'Property deleted successfully.' });
    } catch (err) {
        next(err);
    }
}