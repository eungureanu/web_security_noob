import mongoose from 'mongoose';

const requestCount = new Map();

const DANGEROUS_VALUE_PATTERN = /[\$\{\}]/;
const DANGEROUS_KEY_PATTERN = /[\$\{\}.\[\]]/;
const SAFE_FIELD_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;
const MAX_STRING_LENGTH = 1000;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB for file uploads

/**
 * Returns true when a field name could be used for MongoDB operator or dot-notation injection.
 * @param key - The field or query parameter name.
 * @returns true if the key is unsafe, false otherwise.
 */
export function isDangerousFieldKey(key) {
    return typeof key !== 'string'
        || DANGEROUS_KEY_PATTERN.test(key)
        || !SAFE_FIELD_KEY_PATTERN.test(key);
}

/**
 * Returns true when a string value contains MongoDB operator symbols.
 * @param value - The value to inspect.
 * @returns true if the value contains dangerous characters, false otherwise.
 */
export function containsDangerousDbOperators(value) {
    return typeof value === 'string' && DANGEROUS_VALUE_PATTERN.test(value);
}

/**
 * Recursively checks user input for operator symbols, unsafe keys, or nested objects/arrays
 * that could be passed through to MongoDB queries.
 * @param value - The value to inspect.
 * @returns true if dangerous input is detected, false otherwise.
 */
function containsDangerousNestedInput(value) {
    if (containsDangerousDbOperators(value)) {
        return true;
    }

    if (Array.isArray(value)) {
        return value.some((item) =>
            typeof item === 'object' && item !== null
                ? containsDangerousNestedInput(item)
                : containsDangerousDbOperators(item)
        );
    }

    if (value !== null && typeof value === 'object') {
        return Object.entries(value).some(
            ([key, nestedValue]) =>
                isDangerousFieldKey(key) || containsDangerousNestedInput(nestedValue)
        );
    }

    return false;
}

/**
 * Validates query parameter values. Only scalar strings, numbers, and booleans are allowed.
 * @param value - The query parameter value.
 * @param keyPath - Human-readable path used in security logs.
 * @param req - The Express request object.
 * @returns true if the value is safe, false otherwise.
 */
function isSafeQueryValue(value, keyPath, req) {
    if (value === null || value === undefined) {
        return true;
    }

    if (typeof value === 'string') {
        if (containsDangerousDbOperators(value)) {
            console.log(`[SECURITY] Blocked suspicious query param from IP ${req.ip}: ${keyPath}=${value}`);
            return false;
        }
        return true;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return true;
    }

    console.log(`[SECURITY] Blocked non-scalar query param from IP ${req.ip}: ${keyPath}`);
    return false;
}

/**
 * Validates that a value is a non-empty string within safe limits and contains no injection patterns.
 * @param value - The value to validate.
 * @param maxLength - Maximum allowed length.
 * @returns true if valid, false otherwise.
 */
export function isValidString(value, maxLength = MAX_STRING_LENGTH) {
    return typeof value === 'string' && 
           value.trim().length > 0 && 
           value.length <= maxLength &&
           !containsDangerousDbOperators(value);
}

/**
 * Validates that a value is a positive number.
 * @param value - The value to validate.
 * @returns true if valid, false otherwise.
 */
export function isValidPositiveNumber(value) {
    return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/**
 * Validates that a value is a valid date string.
 * @param value - The value to validate.
 * @returns true if valid, false otherwise.
 */
export function isValidDate(value) {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
}

/**
 * Validates that a value is one of the allowed enum values.
 * @param value - The value to validate.
 * @param allowedValues - Array of allowed values.
 * @returns true if valid, false otherwise.
 */
export function isValidEnum(value, allowedValues) {
    return allowedValues.includes(value);
}

/**
 * Encodes URL parameters according to RFC 3986.
 * @param str - The string to encode.
 * @returns The percent-encoded string.
 */
export function encodeRFC3986(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * Decodes URL parameters according to RFC 3986.
 * @param str - The encoded string.
 * @returns The decoded string.
 */
export function decodeRFC3986(str) {
    try {
        return decodeURIComponent(str);
    } catch {
        return str;
    }
}

/**
 * Creates a validation middleware for request body fields with field allowlists.
 * @param allowedFields - Array of field names allowed in the request body.
 * @param requiredFields - Array of field names that must be present (for create operations).
 * @param validators - Object mapping field names to validation functions.
 * @returns Express middleware function.
 */
export function validateRequestBody(allowedFields, requiredFields = [], validators = {}) {
    return function(req, res, next) {
        if (!req.body || typeof req.body !== 'object') {
            console.log(`[VALIDATION] Invalid request body from IP ${req.ip}`);
            return res.status(400).json({ error: 'Invalid request format.' });
        }

        const sanitizedBody = {};
        
        for (const field of requiredFields) {
            if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
                console.log(`[VALIDATION] Missing required field '${field}' from IP ${req.ip}`);
                return res.status(400).json({ error: 'Missing required fields.' });
            }
        }

        for (const [key, value] of Object.entries(req.body)) {
            if (isDangerousFieldKey(key)) {
                console.log(`[SECURITY] Blocked dangerous field key '${key}' from IP ${req.ip}`);
                return res.status(400).json({ error: 'Invalid input detected.' });
            }

            if (!allowedFields.includes(key)) {
                console.log(`[VALIDATION] Blocked disallowed field '${key}' from IP ${req.ip}`);
                continue;
            }

            if (containsDangerousNestedInput(value)) {
                console.log(`[SECURITY] Blocked dangerous pattern in field '${key}' from IP ${req.ip}`);
                return res.status(400).json({ error: 'Invalid input detected.' });
            }

            if (validators[key] && !validators[key](value)) {
                console.log(`[VALIDATION] Invalid value for field '${key}' from IP ${req.ip}`);
                return res.status(400).json({ error: 'Invalid field values.' });
            }

            sanitizedBody[key] = value;
        }

        req.sanitizedBody = sanitizedBody;
        next();
    };
}

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
 * Decodes path and query parameter values according to RFC 3986 before validation.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function.
 */
export function decodeUrlParams(req, res, next) {
    for (const key of Object.keys(req.params)) {
        const value = req.params[key];

        if (typeof value === 'string') {
            req.params[key] = decodeRFC3986(value);
        }
    }

    for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
            req.query[key] = decodeRFC3986(value);
        }
    }

    next();
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
 * Rejects query strings whose keys or values contain MongoDB operators, dot notation,
 * bracket notation, or other patterns commonly used in injection attacks.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function.
 */
export function sanitizeQueryParams(req, res, next) {
    for (const [key, value] of Object.entries(req.query)) {
        if (isDangerousFieldKey(key)) {
            console.log(`[SECURITY] Blocked suspicious query param key from IP ${req.ip}: ${key}`);
            return res.status(400).json({ error: 'Invalid query parameters.' });
        }

        if (!isSafeQueryValue(value, key, req)) {
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
