import mongoose from 'mongoose';

const requestCount = new Map(); // data structure for storing key-value pairs; value is an object containing count and windowStart
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // time window for rate limiting (1 minute)
const RATE_LIMIT_MAX_REQUESTS = 100; // maximum number of requests allowed within the time window

/**
 * Limits how many requests a single IP can make within the configured time window.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function.
 */
export function limitRate(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress; // get client IP address
    const now = Date.now(); // record current time

    // if this is the first request from this IP, or if the time window has expired, we reset the count and restart the time window
    if (!requestCount.has(ip)) {
        requestCount.set(ip, { count: 1, windowStart: now });
        return next();
    }

    // if requests have already been made from this IP, we check if the time window has expired. If it has, we reset the count and restart the time window.
    const request = requestCount.get(ip);

    if (now - request.windowStart > RATE_LIMIT_WINDOW_MS) {
        requestCount.set(ip, { count: 1, windowStart: now });
        return next();
    }

    // if the time window has not expired, we increment the count and check if it exceeds the maximum allowed requests
    request.count++;

    // if the count exceeds the maximum allowed requests, we log the situation to the terminal and return a generic response to the user
    if (request.count > RATE_LIMIT_MAX_REQUESTS) {
        console.log(`[RATE_LIMIT] IP ${ip} exceeded limit at ${new Date().toISOString()}`);
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    next();
}

/**
 * Logs incoming requests, including the timestamp, client IP, HTTP method, and requested URL.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function.
 */
export function logRequests(req, res, next) {
    // get client IP address
    const ip = req.ip || req.connection.remoteAddress;
    
    // record current time in ISO format, for compatibility across different systems
    const timestamp = new Date().toISOString();
    
    // log the request details to the terminal. In a production app, it would be a permanent log file or logging service
    console.log(`[REQUEST] ${timestamp} | IP: ${ip} | ${req.method} ${req.originalUrl}`);
    
    next();
}

/**
 * Removes the X-Powered-By header from the response.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function.
 */
export function removePoweredByHeader(req, res, next) {
    res.removeHeader('X-Powered-By');
    next();
}

/**
 * Handles errors that occur during request processing.
 * @param err - The error object.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function.
 */
export function handleErrors(err, req, res, next) {
    const ip = req.ip || req.connection.remoteAddress; // get client IP address
    
    // log the error details to the terminal. In a production app, it would be a permanent log file or logging service
    console.error(`[ERROR] ${new Date().toISOString()} | IP: ${ip} | ${req.method} ${req.originalUrl}`);
    
    // log the error stack trace or message for debugging purposes. In a production app, it would be a permanent log file or logging service
    console.error(`[ERROR_DETAILS] ${err.stack || err.message}`);

    // return a generic error response to the client without exposing sensitive details
    res.status(500).json({ error: 'An internal error occurred. Please try again later.' });
}

/**
 * Validates request parameters which are expected to be MongoDB ObjectIds.
 * @param paramName - The name of the query or route parameter to validate.
 * @returns Express middleware function that validates the selected parameter.
 */
export function validateObjectId(paramName) {
    return function (req, res, next) {
        
        // first look in the URL path to find the param
        let id = req.params[paramName];

        //if not there, look in the query string to find the param
        if (!id) {
            id = req.query[paramName];
        }

        //if none found, return
        if (!id) {
            return next();
        }

        // if the param is found, check that it is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            // if it is not, return a 400 Bad Request response with a generic error message. 
            return res.status(400).json({ error: 'Invalid identifier format.' });
        }

        next();
    };
}

/**
 * Rejects query strings that contain characters commonly used in injection attacks, such as $ or {}.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function.
 */
export function sanitizeQueryParams(req, res, next) {
    
    // define the regex pattern to detect dangerous characters. In this case, we are looking for $ and {} which are commonly used in injection attacks
    const dangerousPatterns = /[\$\{\}]/;

    for (const [key, value] of Object.entries(req.query)) {
        // check if the query parameter value is a string and contains any dangerous characters
        if (typeof value === 'string' && dangerousPatterns.test(value)) {

            // if it does, log the attempt to the terminal 
            console.log(`[SECURITY] Blocked suspicious query param from IP ${req.ip}: ${key}=${value}`);

            // and return a 400 Bad Request response with a generic error message
            return res.status(400).json({ error: 'Invalid query parameters.' });
        }
    }

    next();
}

/**
 * Applies pagination defaults and clamps the limit/page query parameters.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function.
 */
export function validatePagination(req, res, next) {
    // limit the maximum number of items per page to prevent abuse and excessive load on the server. The default limit is set to 20, and the maximum limit is set to 50. 
    const MAX_LIMIT = 50;
    const DEFAULT_LIMIT = 20;

    let limit = parseInt(req.query.limit, 10);
    let page = parseInt(req.query.page, 10);

    // if the client does not provide a limit, or if it provides an invalid limit (e.g., negative number, zero, or non-numeric), we will use the default limit. 
    if (isNaN(limit) || limit < 1) {
        limit = DEFAULT_LIMIT;

    // if the client provides a limit that exceeds the maximum allowed, we set it to the maximum limit.
    } else if (limit > MAX_LIMIT) {
        limit = MAX_LIMIT;
    }

    // if the client does not provide a page, or if it provides an invalid page (e.g., negative number, zero, or non-numeric), we will default to page 1.
    if (isNaN(page) || page < 1) {
        page = 1;
    }

    req.pagination = {
        limit,
        page,
        skip: (page - 1) * limit
    };

    next();
}