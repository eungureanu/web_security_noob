import express from 'express';
import { News } from '../models/news.model.js';
import { Tax } from '../models/tax.model.js';
import { Appointment } from '../models/appointment.model.js';
import { Citizen } from '../models/citizen.model.js';
import { Property } from '../models/property.model.js';
import { Request } from '../models/request.model.js';
import { PublicDocument } from '../models/publicDocument.model.js';

const router = express.Router();

router.get('/news', async (req, res) => {
    try {
        const news = await News.find().sort({ createdAt: -1 });
        res.json(news);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/taxes', async (req, res) => {
    try {
        const taxes = await Tax.find().sort({ dueDate: -1 });
        res.json(taxes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({ date: -1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/citizens', async (req, res) => {
    try {
        const citizens = await Citizen.find().sort({ lastName: 1 });
        res.json(citizens);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/properties', async (req, res) => {
    try {
        const properties = await Property.find().sort({ createdAt: -1 });
        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/requests', async (req, res) => {
    try {
        const requests = await Request.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/documents', async (req, res) => {
    try {
        const documents = await PublicDocument.find().sort({ createdAt: -1 });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
