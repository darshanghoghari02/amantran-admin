import express from 'express';
import { dbService } from '../services/db.js';
import { requirePermission, logAuditEvent } from '../middleware/auth.js';

const router = express.Router();

// Helper to parse Firestore timestamp or string to ISO string
function safeDate(val) {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val.toDate === 'function') return val.toDate().toISOString();
  if (typeof val._seconds === 'number') return new Date(val._seconds * 1000).toISOString();
  if (typeof val.seconds === 'number') return new Date(val.seconds * 1000).toISOString();
  try { const d = new Date(val); return isNaN(d.getTime()) ? null : d.toISOString(); } catch { return null; }
}

// GET all user subscriptions (admin view)
router.get('/', requirePermission('users.view'), async (req, res) => {
  try {
    const list = await dbService.getAll('user_subscriptions');
    const normalized = list.map(s => ({
      id: s.id,
      userId: s.userId || s.id, // In real Firestore, doc ID IS the userId
      planType: s.planType || s.type || 'monthly',
      type: s.planType || s.type || 'monthly',
      isActive: s.isActive !== false,
      startDate: safeDate(s.startDate),
      expiryDate: safeDate(s.expiryDate),
      amountPaid: Number(s.amountPaid) || 0,
      purchasedTemplates: s.purchasedTemplates || [],
      updatedAt: safeDate(s.updatedAt)
    }));
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET active subscription by userId (doc ID = userId in Firestore)
router.get('/:userId', async (req, res) => {
  try {
    // Try direct doc lookup first (Firestore: doc ID = userId)
    let sub = await dbService.getOne('user_subscriptions', req.params.userId);

    if (!sub) {
      // Fallback: scan list for matching userId field
      const list = await dbService.getAll('user_subscriptions');
      sub = list.find(s => (s.userId === req.params.userId || s.id === req.params.userId) && s.isActive !== false) || null;
    }

    if (!sub) return res.status(404).json({ error: 'No subscription found for this user.' });

    res.json({
      id: sub.id,
      userId: sub.userId || sub.id,
      planType: sub.planType || sub.type || 'monthly',
      type: sub.planType || sub.type || 'monthly',
      isActive: sub.isActive !== false,
      startDate: safeDate(sub.startDate),
      expiryDate: safeDate(sub.expiryDate),
      amountPaid: Number(sub.amountPaid) || 0,
      purchasedTemplates: sub.purchasedTemplates || [],
      updatedAt: safeDate(sub.updatedAt)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST assign/create a subscription for an app user (admin grants access)
router.post('/', requirePermission('users.edit'), async (req, res) => {
  try {
    const adminUserId = req.headers['x-user-id'];
    const { userId, planType, type, startDate, expiryDate, amountPaid } = req.body;
    
    if (!userId || (!planType && !type) || !expiryDate) {
      return res.status(400).json({ error: 'userId, planType, and expiryDate are required.' });
    }

    const resolvedPlanType = planType || type;
    const now = new Date().toISOString();

    // In Firestore the document ID is the userId — use update/set with that ID
    const subData = {
      id: userId,
      userId,
      planType: resolvedPlanType,
      type: resolvedPlanType,
      isActive: true,
      startDate: startDate || now,
      expiryDate,
      amountPaid: Number(amountPaid) || 0,
      updatedAt: now
    };

    // Check if subscription already exists (doc ID = userId)
    const existing = await dbService.getOne('user_subscriptions', userId);
    let result;
    if (existing) {
      result = await dbService.update('user_subscriptions', userId, {
        planType: resolvedPlanType,
        type: resolvedPlanType,
        isActive: true,
        startDate: startDate || now,
        expiryDate,
        amountPaid: Number(amountPaid) || 0,
        updatedAt: now
      });
    } else {
      result = await dbService.add('user_subscriptions', subData);
    }

    await logAuditEvent(adminUserId, `Assigned ${resolvedPlanType} plan to user: ${userId}`, 'Subscriptions');
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update a user's subscription (by userId, since doc ID = userId in Firestore)
router.put('/:userId', requirePermission('users.edit'), async (req, res) => {
  try {
    const adminUserId = req.headers['x-user-id'];
    const updates = {};
    const { planType, type, startDate, expiryDate, isActive, amountPaid } = req.body;
    
    const resolvedPlanType = planType || type;
    if (resolvedPlanType !== undefined) { updates.planType = resolvedPlanType; updates.type = resolvedPlanType; }
    if (startDate !== undefined) updates.startDate = startDate;
    if (expiryDate !== undefined) updates.expiryDate = expiryDate;
    if (isActive !== undefined) updates.isActive = isActive === true;
    if (amountPaid !== undefined) updates.amountPaid = Number(amountPaid) || 0;
    updates.updatedAt = new Date().toISOString();

    const updated = await dbService.update('user_subscriptions', req.params.userId, updates);
    await logAuditEvent(adminUserId, `Updated subscription for user: ${req.params.userId}`, 'Subscriptions');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE revoke/remove a user's subscription
router.delete('/:userId', requirePermission('users.edit'), async (req, res) => {
  try {
    const adminUserId = req.headers['x-user-id'];
    await dbService.update('user_subscriptions', req.params.userId, { isActive: false, updatedAt: new Date().toISOString() });
    await logAuditEvent(adminUserId, `Revoked subscription for user: ${req.params.userId}`, 'Subscriptions');
    res.json({ success: true, message: 'Subscription revoked.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
