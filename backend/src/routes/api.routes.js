import express from 'express';
import { News } from '../models/news.model.js';
import { Tax } from '../models/tax.model.js';
import { Appointment } from '../models/appointment.model.js';
import { Citizen } from '../models/citizen.model.js';
import { Property } from '../models/property.model.js';
import { Request } from '../models/request.model.js';
import { PublicDocument } from '../models/publicDocument.model.js';

const router = express.Router();

// ==================== NEWS ====================
router.get('/news', async (req, res) => {
    try {
        const news = await News.find().sort({ createdAt: -1 });
        res.json(news);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/news', async (req, res) => {
    try {
        const news = new News(req.body);
        await news.save();
        res.status(201).json(news);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/news/:id', async (req, res) => {
    try {
        const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!news) return res.status(404).json({ error: 'News not found' });
        res.json(news);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/news/:id', async (req, res) => {
    try {
        const news = await News.findByIdAndDelete(req.params.id);
        if (!news) return res.status(404).json({ error: 'News not found' });
        res.json({ message: 'News deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== TAXES ====================
router.get('/taxes', async (req, res) => {
    try {
        const taxes = await Tax.find().sort({ dueDate: -1 });
        res.json(taxes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/taxes', async (req, res) => {
    try {
        const tax = new Tax(req.body);
        await tax.save();
        res.status(201).json(tax);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/taxes/:id', async (req, res) => {
    try {
        const tax = await Tax.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!tax) return res.status(404).json({ error: 'Tax not found' });
        res.json(tax);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/taxes/:id', async (req, res) => {
    try {
        const tax = await Tax.findByIdAndDelete(req.params.id);
        if (!tax) return res.status(404).json({ error: 'Tax not found' });
        res.json({ message: 'Tax deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== APPOINTMENTS ====================
router.get('/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({ date: -1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/appointments', async (req, res) => {
    try {
        const appointment = new Appointment(req.body);
        await appointment.save();
        res.status(201).json(appointment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/appointments/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
        res.json(appointment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/appointments/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);
        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
        res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== CITIZENS ====================
router.get('/citizens', async (req, res) => {
    try {
        const citizens = await Citizen.find().sort({ lastName: 1 });
        res.json(citizens);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/citizens', async (req, res) => {
    try {
        const citizen = new Citizen(req.body);
        await citizen.save();
        res.status(201).json(citizen);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/citizens/:id', async (req, res) => {
    try {
        const citizen = await Citizen.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!citizen) return res.status(404).json({ error: 'Citizen not found' });
        res.json(citizen);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/citizens/:id', async (req, res) => {
    try {
        const citizen = await Citizen.findByIdAndDelete(req.params.id);
        if (!citizen) return res.status(404).json({ error: 'Citizen not found' });
        res.json({ message: 'Citizen deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== PROPERTIES ====================
router.get('/properties', async (req, res) => {
    try {
        const properties = await Property.find().sort({ createdAt: -1 });
        res.json(properties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/properties', async (req, res) => {
    try {
        const property = new Property(req.body);
        await property.save();
        res.status(201).json(property);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/properties/:id', async (req, res) => {
    try {
        const property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!property) return res.status(404).json({ error: 'Property not found' });
        res.json(property);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/properties/:id', async (req, res) => {
    try {
        const property = await Property.findByIdAndDelete(req.params.id);
        if (!property) return res.status(404).json({ error: 'Property not found' });
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== REQUESTS ====================
router.get('/requests', async (req, res) => {
    try {
        const requests = await Request.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/requests', async (req, res) => {
    try {
        const request = new Request(req.body);
        await request.save();
        res.status(201).json(request);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/requests/:id', async (req, res) => {
    try {
        const request = await Request.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.json(request);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/requests/:id', async (req, res) => {
    try {
        const request = await Request.findByIdAndDelete(req.params.id);
        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== DOCUMENTS ====================
router.get('/documents', async (req, res) => {
    try {
        const documents = await PublicDocument.find().sort({ createdAt: -1 });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/documents', async (req, res) => {
    try {
        const document = new PublicDocument(req.body);
        await document.save();
        res.status(201).json(document);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/documents/:id', async (req, res) => {
    try {
        const document = await PublicDocument.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!document) return res.status(404).json({ error: 'Document not found' });
        res.json(document);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/documents/:id', async (req, res) => {
    try {
        const document = await PublicDocument.findByIdAndDelete(req.params.id);
        if (!document) return res.status(404).json({ error: 'Document not found' });
        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
