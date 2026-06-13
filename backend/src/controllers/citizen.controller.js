import { Citizen } from '../models/citizen.model.js';

export async function showAllCitizens(req, res, next) {
    try {
        const { limit, skip } = req.pagination;

        const [items, total] = await Promise.all([
            Citizen.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('_id firstName lastName'),
            Citizen.countDocuments({})
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

export async function createCitizen(req, res, next) {
    try {
        const { firstName, lastName, CNP, idCardNumber, address, phone } = req.sanitizedBody;
        
        const citizen = new Citizen({ 
            firstName, 
            lastName, 
            CNP, 
            idCardNumber, 
            address, 
            phone 
        });
        const saved = await citizen.save();
        
        console.log(`[CREATE] Citizen created with ID ${saved._id} from IP ${req.ip}`);
        
        res.status(201).json({
            data: {
                _id: saved._id,
                firstName: saved.firstName,
                lastName: saved.lastName
            }
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'A record with this identifier already exists.' });
        }
        next(err);
    }
}

export async function updateCitizen(req, res, next) {
    try {
        const { id } = req.params;
        const updateData = req.sanitizedBody;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update.' });
        }
        
        const updated = await Citizen.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('_id firstName lastName');
        
        if (!updated) {
            return res.status(404).json({ error: 'Resource not found.' });
        }
        
        console.log(`[UPDATE] Citizen ${id} updated from IP ${req.ip}`);
        
        res.json({ data: updated });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'A record with this identifier already exists.' });
        }
        next(err);
    }
}

export async function deleteCitizen(req, res, next) {
    try {
        const { id } = req.params;
        
        const deleted = await Citizen.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Resource not found.' });
        }
        
        console.log(`[DELETE] Citizen ${id} deleted from IP ${req.ip}`);
        
        res.json({ message: 'Resource deleted successfully.' });
    } catch (err) {
        next(err);
    }
}
