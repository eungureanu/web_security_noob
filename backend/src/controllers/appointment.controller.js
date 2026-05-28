import { Appointment } from '../models/appointment.model.js';

export async function showAllAppointments(req, res, next) {
    try {
        const { limit, skip } = req.pagination; // get the limit and skip parameters from the request
        const { citizenId } = req.query; // get the citizenId from the query string

        const filter = citizenId ? { citizenId } : {}; // if citizenId is provided, filter the appointments by citizenId, otherwise no filter is applied

        const [items, total] = await Promise.all([
            Appointment.find(filter)
                .sort({ date: -1 }) // sort the appointments by date in descending order
                .skip(skip) // skip the number of items specified by the skip parameter
                .limit(limit) // limit the number of items to the number specified by the limit parameter
                .select('department date purpose status'), // select the department, date, purpose, and status fields
            Appointment.countDocuments(filter) // count the number of appointments
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
        next(err); // pass the error to the error handling middleware
    }
}