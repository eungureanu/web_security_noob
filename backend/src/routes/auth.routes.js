import { Router } from 'express';
import mongoose from 'mongoose';
import { register, login, getCurrentUser, createEmployee } from '../controllers/auth.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateRequestBody, isValidString, isValidEnum } from '../middleware/security.js';

const router = Router();

// Login fields
const LOGIN_ALLOWED = ['email', 'password'];
const LOGIN_REQUIRED = ['email', 'password'];
const LOGIN_VALIDATORS = {
    email: (v) => isValidString(v, 100) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    password: (v) => isValidString(v, 100) && v.length >= 1
};

// Register fields
const REGISTER_ALLOWED = ['email', 'password', 'citizenId'];
const REGISTER_REQUIRED = ['email', 'password', 'citizenId'];
const REGISTER_VALIDATORS = {
    email: (v) => isValidString(v, 100) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    password: (v) => isValidString(v, 100) && v.length >= 6,
    citizenId: (v) => mongoose.Types.ObjectId.isValid(v)
};

// Create employee fields
const EMPLOYEE_ALLOWED = ['email', 'password', 'role'];
const EMPLOYEE_REQUIRED = ['email', 'password', 'role'];
const EMPLOYEE_VALIDATORS = {
    email: (v) => isValidString(v, 100) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    password: (v) => isValidString(v, 100) && v.length >= 6,
    role: (v) => isValidEnum(v, ['registry', 'taxes', 'super_admin'])
};

// Public routes
router.post('/register', validateRequestBody(REGISTER_ALLOWED, REGISTER_REQUIRED, REGISTER_VALIDATORS), register);
router.post('/login', validateRequestBody(LOGIN_ALLOWED, LOGIN_REQUIRED, LOGIN_VALIDATORS), login);

// Protected routes
router.get('/me', requireAuth, getCurrentUser);

// Admin-only routes
router.post('/create-employee', requireAuth, requireRole('super_admin'), validateRequestBody(EMPLOYEE_ALLOWED, EMPLOYEE_REQUIRED, EMPLOYEE_VALIDATORS), createEmployee);

export default router;
