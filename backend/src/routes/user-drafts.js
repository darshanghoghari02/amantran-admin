import express from 'express';
import { dbService } from '../services/db.js';

const router = express.Router();

// GET all drafts (admin view, read-only)
router.get('/', async (req, res) => {
  try {
    const list = await dbService.getAll('user_drafts');
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all drafts for a user
router.get('/:userId', async (req, res) => {
  try {
    const list = await dbService.getAll('user_drafts');
    const userDrafts = list.filter(d => d.userId === req.params.userId);
    res.json(userDrafts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single draft by draftId
router.get('/single/:draftId', async (req, res) => {
  try {
    const draft = await dbService.getOne('user_drafts', req.params.draftId);
    if (!draft) return res.status(404).json({ error: 'Draft not found.' });
    res.json(draft);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST save new draft
router.post('/', async (req, res) => {
  try {
    const { userId, templateId, templateName, customizedData, isPurchased } = req.body;
    if (!userId || !templateId) {
      return res.status(400).json({ error: 'userId and templateId are required.' });
    }

    const newDraft = await dbService.add('user_drafts', {
      userId,
      templateId,
      templateName: templateName || '',
      customizedData: customizedData || {},
      isPurchased: isPurchased === true,
      savedAt: new Date().toISOString()
    });

    res.status(201).json(newDraft);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update draft (auto-save)
router.put('/:draftId', async (req, res) => {
  try {
    const updates = {};
    const { customizedData, isPurchased } = req.body;
    if (customizedData !== undefined) updates.customizedData = customizedData;
    if (isPurchased !== undefined) updates.isPurchased = isPurchased === true;
    updates.savedAt = new Date().toISOString();

    const updated = await dbService.update('user_drafts', req.params.draftId, updates);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE draft
router.delete('/:draftId', async (req, res) => {
  try {
    await dbService.delete('user_drafts', req.params.draftId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
