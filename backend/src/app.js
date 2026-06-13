import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.routes.js';
import authRoutes from './routes/auth.routes.js';
import { limitRate, logRequests, removePoweredByHeader, handleErrors } from './middleware/security.js';
import { attachUser } from './middleware/auth.js';

import path from 'path';
import { fileURLToPath } from 'url';
const filename = fileURLToPath(import.meta.url);
const directoryname = path.dirname(filename);

const app = express();

// the security middleware methods are applied on every request, in order
app.use(removePoweredByHeader);

const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// parse incoming JSON requests and limit the request body size to 10KB
app.use(express.json({ limit: '10kb' }));

app.use(logRequests);
app.use(limitRate);

// Attach user from JWT token on all requests (does not block unauthenticated)
app.use(attachUser);

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/assets', express.static(path.join(directoryname, '../assets')));

app.use((req, res) => {
    res.status(404).json({ error: 'Resource not found.' }); 
});

app.use(handleErrors);

export default app;