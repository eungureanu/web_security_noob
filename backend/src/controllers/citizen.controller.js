import { Citizen } from '../models/citizen.model.js';

export async function showAllCitizens(req, res, next) {
    try {
        const { limit, skip } = req.pagination;
        const user = req.user;

        // Citizens can only see themselves; employees and admins can see all
        let filter = {};
        if (user.role === 'citizen') {
            filter = { _id: user.citizenId };
        }

        const [items, total] = await Promise.all([
            Citizen.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('_id firstName lastName'),
            Citizen.countDocuments(filter)
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

export async function getCitizenById(req, res, next) {
    try {
        const { id } = req.params;
        const user = req.user;

        // Citizens can only get their own record
        if (user.role === 'citizen' && user.citizenId?.toString() !== id) {
            return res.status(403).json({ error: 'Nu aveți permisiunea de a vizualiza datele altor cetățeni.' });
        }

        const citizen = await Citizen.findById(id);
        
        if (!citizen) {
            return res.status(404).json({ error: 'Cetățeanul nu a fost găsit.' });
        }

        res.json({ data: citizen });
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
        const user = req.user;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update.' });
        }

        // Citizens can only update their own record
        if (user.role === 'citizen' && user.citizenId?.toString() !== id) {
            return res.status(403).json({ error: 'Nu puteți modifica datele altor cetățeni.' });
        }

        // Only super_admin can update citizen data (citizens can only update via their own endpoint)
        if (user.role !== 'super_admin' && user.role !== 'citizen') {
            return res.status(403).json({ error: 'Nu aveți permisiunea de a modifica datele cetățenilor.' });
        }
        
        const updated = await Citizen.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('_id firstName lastName');
        
        if (!updated) {
            return res.status(404).json({ error: 'Resource not found.' });
        }
        
        console.log(`[UPDATE] Citizen ${id} updated by ${user.email} (${user.role}) from IP ${req.ip}`);
        
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
