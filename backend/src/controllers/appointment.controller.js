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
                .select('citizenId department date purpose status'),
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
        const { citizenId, department, date, purpose, status } = req.sanitizedBody;
        
        const appointment = new Appointment({ 
            citizenId, 
            department, 
            date, 
            purpose, 
            status: status || 'scheduled' 
        });
        const saved = await appointment.save();
        
        console.log(`[CREATE] Appointment created with ID ${saved._id} from IP ${req.ip}`);
        
        res.status(201).json({
            data: {
                _id: saved._id,
                citizenId: saved.citizenId,
                department: saved.department,
                date: saved.date,
                purpose: saved.purpose,
                status: saved.status
            }
        });
    } catch (err) {
        next(err);
    }
}

export async function updateAppointment(req, res, next) {
    try {
        const { id } = req.params;
        const updateData = req.sanitizedBody;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update.' });
        }
        
        const updated = await Appointment.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('citizenId department date purpose status');
        
        if (!updated) {
            return res.status(404).json({ error: 'Resource not found.' });
        }
        
        console.log(`[UPDATE] Appointment ${id} updated from IP ${req.ip}`);
        
        res.json({ data: updated });
    } catch (err) {
        next(err);
    }
}

export async function deleteAppointment(req, res, next) {
    try {
        const { id } = req.params;
        
        const deleted = await Appointment.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Resource not found.' });
        }
        
        console.log(`[DELETE] Appointment ${id} deleted from IP ${req.ip}`);
        
        res.json({ message: 'Resource deleted successfully.' });
    } catch (err) {
        next(err);
    }
}
