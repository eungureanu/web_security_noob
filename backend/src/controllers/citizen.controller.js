import { Citizen } from '../models/citizen.model.js';

export async function showAllCitizens(req, res, next) {
    try {
        const { limit, skip } = req.pagination; // get the limit and skip parameters from the request

        const [items, total] = await Promise.all([
            Citizen.find({}) // find all citizen items - no filter is applied
                .sort({ createdAt: -1 }) // sort the citizen items by createdAt in descending order
                .skip(skip) // skip the number of items specified by the skip parameter
                .limit(limit) // limit the number of items to the number specified by the limit parameter
                .select('_id firstName lastName'), // select only the mentioned fields
            Citizen.countDocuments({}) // count the number of citizen items
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