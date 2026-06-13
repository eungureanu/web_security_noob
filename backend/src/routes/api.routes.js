import { Router } from 'express';
import { decodeUrlParams, validatePagination, sanitizeQueryParams } from '../middleware/security.js';
import newsRoutes from './news.routes.js';
import taxRoutes from './tax.routes.js';
import propertyRoutes from './property.routes.js';
import appointmentRoutes from './appointment.routes.js';
import requestRoutes from './request.routes.js';
import publicDocumentRoutes from './publicDocument.routes.js';
import citizenRoutes from './citizen.routes.js';

const router = Router();

// decode URL params first, then validate and sanitize query parameters on every request
router.use(decodeUrlParams);
router.use(sanitizeQueryParams);
router.use(validatePagination);

// the routes are defined in the respective files
router.use('/news', newsRoutes);
router.use('/taxes', taxRoutes);
router.use('/properties', propertyRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/citizens', citizenRoutes);
router.use('/requests', requestRoutes);
router.use('/public-documents', publicDocumentRoutes);

export default router;
