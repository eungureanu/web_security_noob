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
        const { firstName, lastName, CNP, idCardNumber, address, phone } = req.body;
        
        if (!firstName || !lastName || !CNP || !idCardNumber || !address || !phone) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const citizen = new Citizen({ firstName, lastName, CNP, idCardNumber, address, phone });
        await citizen.save();
        
        res.status(201).json({ data: citizen });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'A citizen with this CNP already exists.' });
        }
        next(err);
    }
}

export async function updateCitizen(req, res, next) {
    try {
        const { id } = req.params;
        const { firstName, lastName, CNP, idCardNumber, address, phone } = req.body;

        const citizen = await Citizen.findByIdAndUpdate(
            id,
            { firstName, lastName, CNP, idCardNumber, address, phone },
            { new: true, runValidators: true }
        );

        if (!citizen) {
            return res.status(404).json({ error: 'Citizen not found.' });
        }

        res.json({ data: citizen });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'A citizen with this CNP already exists.' });
        }
        next(err);
    }
}

export async function deleteCitizen(req, res, next) {
    try {
        const { id } = req.params;
        
        const citizen = await Citizen.findByIdAndDelete(id);

        if (!citizen) {
            return res.status(404).json({ error: 'Citizen not found.' });
        }

        res.json({ message: 'Citizen deleted successfully.' });
    } catch (err) {
        next(err);
    }
}