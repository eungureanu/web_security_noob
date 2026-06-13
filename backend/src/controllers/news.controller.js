import { News } from '../models/news.model.js';

export async function showAllNews(req, res, next) {
    try {
        const { limit, skip } = req.pagination; // get the limit and skip parameters from the request

        const [items, total] = await Promise.all([
            News.find({}) // find all news items - no filter is applied
                .sort({ createdAt: -1 }) // sort the news items by createdAt in descending order
                .skip(skip) // skip the number of items specified by the skip parameter
                .limit(limit) // limit the number of items to the number specified by the limit parameter
                .select('title content author createdAt'), // select the title, content, author, and createdAt fields
            News.countDocuments({}) // count the number of news items
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