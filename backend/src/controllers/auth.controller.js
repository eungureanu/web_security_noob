import bcrypt from 'bcrypt';
import { User, USER_ROLES } from '../models/user.model.js';
import { Citizen } from '../models/citizen.model.js';
import { generateToken, PERMISSIONS } from '../middleware/auth.js';

const SALT_ROUNDS = 12;

/**
 * POST /api/auth/register
 * Register a new citizen user (links to existing citizen record)
 */
export async function register(req, res) {
    try {
        const { email, password, citizenId } = req.sanitizedBody || req.body;

        if (!email || !password || !citizenId) {
            return res.status(400).json({ 
                error: 'Email, parolă și cetățean sunt obligatorii.' 
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Acest email este deja înregistrat.' });
        }

        // Check if citizen exists
        const citizen = await Citizen.findById(citizenId);
        if (!citizen) {
            return res.status(400).json({ error: 'Cetățeanul specificat nu există.' });
        }

        // Check if citizen already has an account
        const existingCitizenAccount = await User.findOne({ citizenId });
        if (existingCitizenAccount) {
            return res.status(400).json({ error: 'Acest cetățean are deja un cont.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        const user = new User({
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'citizen',
            citizenId
        });

        await user.save();

        const token = generateToken(user);

        res.status(201).json({
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    role: user.role,
                    citizenId: user.citizenId
                },
                token,
                permissions: PERMISSIONS[user.role]
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Eroare la înregistrare.' });
    }
}

/**
 * POST /api/auth/login
 * Login with email and password
 */
export async function login(req, res) {
    try {
        const { email, password } = req.sanitizedBody || req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email și parolă sunt obligatorii.' });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Email sau parolă incorectă.' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Email sau parolă incorectă.' });
        }

        const token = generateToken(user);

        // Get citizen info if applicable
        let citizenInfo = null;
        if (user.citizenId) {
            const citizen = await Citizen.findById(user.citizenId);
            if (citizen) {
                citizenInfo = {
                    _id: citizen._id,
                    firstName: citizen.firstName,
                    lastName: citizen.lastName
                };
            }
        }

        res.json({
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    role: user.role,
                    citizenId: user.citizenId,
                    citizen: citizenInfo
                },
                token,
                permissions: PERMISSIONS[user.role]
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Eroare la autentificare.' });
    }
}

/**
 * GET /api/auth/me
 * Get current user info
 */
export async function getCurrentUser(req, res) {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'Utilizatorul nu a fost găsit.' });
        }

        let citizenInfo = null;
        if (user.citizenId) {
            const citizen = await Citizen.findById(user.citizenId);
            if (citizen) {
                citizenInfo = {
                    _id: citizen._id,
                    firstName: citizen.firstName,
                    lastName: citizen.lastName
                };
            }
        }

        res.json({
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    role: user.role,
                    citizenId: user.citizenId,
                    citizen: citizenInfo
                },
                permissions: PERMISSIONS[user.role]
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Eroare la obținerea datelor utilizatorului.' });
    }
}

/**
 * POST /api/auth/create-employee (super_admin only)
 * Create an employee account
 */
export async function createEmployee(req, res) {
    try {
        const { email, password, role } = req.sanitizedBody || req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ 
                error: 'Email, parolă și rol sunt obligatorii.' 
            });
        }

        // Validate role (must be employee role)
        const employeeRoles = ['registry', 'taxes', 'super_admin'];
        if (!employeeRoles.includes(role)) {
            return res.status(400).json({ 
                error: 'Rol invalid. Roluri permise: registry, taxes, super_admin.' 
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Acest email este deja înregistrat.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Create employee user (no citizenId)
        const user = new User({
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            citizenId: null
        });

        await user.save();

        res.status(201).json({
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('Create employee error:', error);
        res.status(500).json({ error: 'Eroare la crearea contului de angajat.' });
    }
}
