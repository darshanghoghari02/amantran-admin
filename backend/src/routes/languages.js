import express from 'express';
import { dbService } from '../services/db.js';

const router = express.Router();

// GET all languages
router.get('/', async (req, res) => {
  try {
    const list = await dbService.getAll('languages');
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add language
router.post('/', async (req, res) => {
  try {
    const { code, name, isActive } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required.' });
    }
    const newLang = await dbService.add('languages', {
      code: code.toLowerCase(),
      name,
      isActive: isActive !== false
    });
    res.status(201).json(newLang);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update language
router.put('/:id', async (req, res) => {
  try {
    const { code, name, isActive } = req.body;
    const updates = {};
    if (code !== undefined) updates.code = code.toLowerCase();
    if (name !== undefined) updates.name = name;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await dbService.update('languages', req.params.id, updates);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE language
router.delete('/:id', async (req, res) => {
  try {
    await dbService.delete('languages', req.params.id);
    res.json({ success: true, message: 'Language removed successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
