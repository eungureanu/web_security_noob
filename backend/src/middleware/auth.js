import jwt from 'jsonwebtoken';
import { User, USER_ROLES } from '../models/user.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * Generates a JWT token for a user
 */
export function generateToken(user) {
    return jwt.sign(
        { 
            userId: user._id, 
            role: user.role,
            citizenId: user.citizenId || null
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

/**
 * Verifies JWT token and attaches user to request
 * Does not block unauthenticated requests - use requireAuth for that
 */
export async function attachUser(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            req.user = null;
            return next();
        }

        req.user = {
            _id: user._id,
            email: user.email,
            role: user.role,
            citizenId: user.citizenId
        };
        next();
    } catch {
        req.user = null;
        next();
    }
}

/**
 * Requires authentication - returns 401 if not logged in
 */
export function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Autentificare necesară.' });
    }
    next();
}

/**
 * Requires one of the specified roles
 */
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Autentificare necesară.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Nu aveți permisiunea necesară pentru această acțiune.' });
        }

        next();
    };
}

/**
 * Permission definitions for each role
 */
export const PERMISSIONS = {
    // Tabs that don't require login
    PUBLIC_TABS: ['home', 'stiri'],
    
    // Resources that can be read/written by role
    citizen: {
        canRead: ['news', 'public-documents', 'taxes', 'properties', 'appointments', 'requests', 'citizens'],
        canWrite: ['citizens', 'appointments'], // own data only
        canReadAll: false, // can only read own data (except news, public-documents)
    },
    registry: {
        canRead: ['news', 'public-documents', 'properties', 'appointments', 'requests', 'citizens'],
        canWrite: ['news', 'public-documents', 'properties', 'appointments', 'requests'],
        canReadAll: true,
    },
    taxes: {
        canRead: ['news', 'public-documents', 'taxes', 'properties', 'appointments', 'requests', 'citizens'],
        canWrite: ['news', 'public-documents', 'taxes'],
        canReadAll: true,
    },
    super_admin: {
        canRead: ['news', 'public-documents', 'taxes', 'properties', 'appointments', 'requests', 'citizens'],
        canWrite: ['news', 'public-documents', 'taxes', 'properties', 'appointments', 'requests', 'citizens'],
        canReadAll: true,
    }
};

/**
 * Maps API endpoints to resource names
 */
const ENDPOINT_TO_RESOURCE = {
    'news': 'news',
    'public-documents': 'public-documents',
    'taxes': 'taxes',
    'properties': 'properties',
    'appointments': 'appointments',
    'requests': 'requests',
    'citizens': 'citizens'
};

/**
 * Middleware to check read permission for a resource
 */
export function canReadResource(resource) {
    return (req, res, next) => {
        // Public resources (news, public-documents) can be read by anyone for GET list
        if (['news', 'public-documents'].includes(resource)) {
            return next();
        }

        // All other resources require authentication
        if (!req.user) {
            return res.status(401).json({ error: 'Autentificare necesară.' });
        }

        const permissions = PERMISSIONS[req.user.role];
        if (!permissions || !permissions.canRead.includes(resource)) {
            return res.status(403).json({ error: 'Nu aveți permisiunea de a vizualiza această resursă.' });
        }

        // For citizens, filter to only their own data
        if (req.user.role === 'citizen' && !['news', 'public-documents'].includes(resource)) {
            req.filterByCitizen = req.user.citizenId;
        }

        next();
    };
}

/**
 * Middleware to check write permission for a resource (create/update/delete)
 */
export function canWriteResource(resource) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Autentificare necesară.' });
        }

        const permissions = PERMISSIONS[req.user.role];
        if (!permissions || !permissions.canWrite.includes(resource)) {
            return res.status(403).json({ error: 'Nu aveți permisiunea de a modifica această resursă.' });
        }

        // For citizens, ensure they can only modify their own data
        if (req.user.role === 'citizen') {
            req.mustOwnResource = true;
            req.ownerCitizenId = req.user.citizenId;
        }

        next();
    };
}

/**
 * Middleware to verify ownership of a resource (for citizens editing their own data)
 */
export async function verifyOwnership(Model, resourceField = 'citizenId') {
    return async (req, res, next) => {
        if (!req.mustOwnResource) {
            return next();
        }

        const { id } = req.params;
        
        try {
            const item = await Model.findById(id);
            
            if (!item) {
                return res.status(404).json({ error: 'Resursa nu a fost găsită.' });
            }

            // For citizens model, check if it's their own record
            if (resourceField === '_id') {
                if (item._id.toString() !== req.ownerCitizenId?.toString()) {
                    return res.status(403).json({ error: 'Nu puteți modifica datele altor cetățeni.' });
                }
            } else {
                // For other models, check citizenId field
                if (item[resourceField]?.toString() !== req.ownerCitizenId?.toString()) {
                    return res.status(403).json({ error: 'Nu puteți modifica datele altor cetățeni.' });
                }
            }

            req.existingItem = item;
            next();
        } catch (error) {
            return res.status(500).json({ error: 'Eroare la verificarea permisiunilor.' });
        }
    };
}

export { JWT_SECRET };
