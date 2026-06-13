import { Appointment } from '../models/appointment.model.js';

export async function showAllAppointments(req, res, next) {
    try {
        const { limit, skip } = req.pagination;
        const { citizenId } = req.query;

        const filter = citizenId ? { citizenId } : {};

        const [items, total] = await Promise.all([
            Appointment.find(filter)
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .select('department date purpose status'),
            Appointment.countDocuments(filter)
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

export async function createAppointment(req, res, next) {
    try {
        const { citizenId, department, date, purpose, status } = req.body;
        
        if (!citizenId || !department || !date || !purpose) {
            return res.status(400).json({ error: 'CitizenId, department, date, and purpose are required.' });
        }

        const appointment = new Appointment({ citizenId, department, date, purpose, status });
        await appointment.save();
        
        res.status(201).json({ data: appointment });
    } catch (err) {
        next(err);
    }
}

export async function updateAppointment(req, res, next) {
    try {
        const { id } = req.params;
        const { citizenId, department, date, purpose, status } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { citizenId, department, date, purpose, status },
            { new: true, runValidators: true }
        );

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found.' });
        }

        res.json({ data: appointment });
    } catch (err) {
        next(err);
    }
}

export async function deleteAppointment(req, res, next) {
    try {
        const { id } = req.params;
        
        const appointment = await Appointment.findByIdAndDelete(id);

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found.' });
        }

        res.json({ message: 'Appointment deleted successfully.' });
    } catch (err) {
        next(err);
    }
}