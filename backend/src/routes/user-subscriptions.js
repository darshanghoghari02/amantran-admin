import express from 'express';
import { dbService } from '../services/db.js';

const router = express.Router();

// GET all subscriptions (admin view)
router.get('/', async (req, res) => {
  try {
    const list = await dbService.getAll('user_subscriptions');
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET subscription by userId
router.get('/:userId', async (req, res) => {
  try {
    const list = await dbService.getAll('user_subscriptions');
    const sub = list.find(s => s.userId === req.params.userId && s.isActive);
    if (!sub) return res.status(404).json({ error: 'No active subscription found.' });
    res.json(sub);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create/assign subscription (admin manually assigns)
router.post('/', async (req, res) => {
  try {
    const { userId, type, startDate, expiryDate, amountPaid } = req.body;
    if (!userId || !type || !expiryDate) {
      return res.status(400).json({ error: 'userId, type, and expiryDate are required.' });
    }

    // Deactivate any existing active subscription for this user
    const existing = await dbService.getAll('user_subscriptions');
    for (const sub of existing.filter(s => s.userId === userId && s.isActive)) {
      await dbService.update('user_subscriptions', sub.id, { isActive: false });
    }

    const now = new Date().toISOString();
    const newSub = await dbService.add('user_subscriptions', {
      userId,
      type,
      startDate: startDate || now,
      expiryDate,
      isActive: true,
      amountPaid: Number(amountPaid) || 0
    });

    res.status(201).json(newSub);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update subscription
router.put('/:id', async (req, res) => {
  try {
    const updates = {};
    const { type, startDate, expiryDate, isActive, amountPaid } = req.body;
    if (type !== undefined) updates.type = type;
    if (startDate !== undefined) updates.startDate = startDate;
    if (expiryDate !== undefined) updates.expiryDate = expiryDate;
    if (isActive !== undefined) updates.isActive = isActive === true;
    if (amountPaid !== undefined) updates.amountPaid = Number(amountPaid) || 0;

    const updated = await dbService.update('user_subscriptions', req.params.id, updates);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE revoke subscription
router.delete('/:id', async (req, res) => {
  try {
    await dbService.delete('user_subscriptions', req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
