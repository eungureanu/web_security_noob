import { Appointment } from '../models/appointment.model.js';

export async function showAllAppointments(req, res, next) {
    try {
        const { limit, skip } = req.pagination;
        const { citizenId } = req.query;
        const user = req.user;

        let filter = {};

        // Citizens can only see their own appointments
        if (user.role === 'citizen') {
            filter = { citizenId: user.citizenId };
        } else if (citizenId) {
            // Employees can filter by citizenId if provided
            filter = { citizenId };
        }

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
        const user = req.user;

        // Citizens can only create appointments for themselves
        if (user.role === 'citizen' && user.citizenId?.toString() !== citizenId) {
            return res.status(403).json({ error: 'Nu puteți crea programări pentru alți cetățeni.' });
        }
        
        const appointment = new Appointment({ 
            citizenId, 
            department, 
            date, 
            purpose, 
            status: status || 'scheduled' 
        });
        const saved = await appointment.save();
        
        console.log(`[CREATE] Appointment created with ID ${saved._id} by ${user.email} from IP ${req.ip}`);
        
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
        const user = req.user;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update.' });
        }

        // First, fetch the appointment to check ownership
        const existing = await Appointment.findById(id);
        if (!existing) {
            return res.status(404).json({ error: 'Resource not found.' });
        }

        // Citizens can only update their own appointments
        if (user.role === 'citizen' && existing.citizenId?.toString() !== user.citizenId?.toString()) {
            return res.status(403).json({ error: 'Nu puteți modifica programările altor cetățeni.' });
        }

        // Tax employees cannot edit appointments
        if (user.role === 'taxes') {
            return res.status(403).json({ error: 'Nu aveți permisiunea de a modifica programări.' });
        }
        
        const updated = await Appointment.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('citizenId department date purpose status');
        
        console.log(`[UPDATE] Appointment ${id} updated by ${user.email} (${user.role}) from IP ${req.ip}`);
        
        res.json({ data: updated });
    } catch (err) {
        next(err);
    }
}

export async function deleteAppointment(req, res, next) {
    try {
        const { id } = req.params;
        const user = req.user;

        // First, fetch the appointment to check ownership
        const existing = await Appointment.findById(id);
        if (!existing) {
            return res.status(404).json({ error: 'Resource not found.' });
        }

        // Citizens can only delete their own appointments
        if (user.role === 'citizen' && existing.citizenId?.toString() !== user.citizenId?.toString()) {
            return res.status(403).json({ error: 'Nu puteți șterge programările altor cetățeni.' });
        }

        // Tax employees cannot delete appointments
        if (user.role === 'taxes') {
            return res.status(403).json({ error: 'Nu aveți permisiunea de a șterge programări.' });
        }
        
        await Appointment.findByIdAndDelete(id);
        
        console.log(`[DELETE] Appointment ${id} deleted by ${user.email} (${user.role}) from IP ${req.ip}`);
        
        res.json({ message: 'Resource deleted successfully.' });
    } catch (err) {
        next(err);
    }
}
