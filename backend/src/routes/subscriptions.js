import express from 'express';
import { dbService } from '../services/db.js';

const router = express.Router();

// Plan seeds if database is empty
const DEFAULT_PLANS = [
  {
    id: 'monthly',
    name: 'Monthly Premium',
    price: 99,
    description: 'Access all monthly premium templates.',
    isActive: true,
    includedCategories: [],
    includedTemplateIds: []
  },
  {
    id: 'yearly',
    name: 'Yearly Premium',
    price: 499,
    description: 'Access all premium templates including yearly exclusives.',
    isActive: true,
    includedCategories: [],
    includedTemplateIds: []
  }
];

// GET all subscription plans
router.get('/', async (req, res) => {
  try {
    let list = await dbService.getAll('subscriptions');
    
    // Seed default plans if none exist in the database
    if (!list || list.length === 0) {
      console.log('🌱 No subscription plans found. Seeding defaults...');
      list = [];
      for (const plan of DEFAULT_PLANS) {
        const seeded = await dbService.add('subscriptions', plan);
        list.push(seeded);
      }
    }
    
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single subscription plan
router.get('/:id', async (req, res) => {
  try {
    const plan = await dbService.getOne('subscriptions', req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found.' });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update subscription plan
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      isActive,
      includedCategories,
      includedTemplateIds,
      durationType,
      durationDays,
      customStartDate,
      customEndDate
    } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = Number(price) || 0;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive === true;
    if (includedCategories !== undefined) updates.includedCategories = Array.isArray(includedCategories) ? includedCategories : [];
    if (includedTemplateIds !== undefined) updates.includedTemplateIds = Array.isArray(includedTemplateIds) ? includedTemplateIds : [];
    if (durationType !== undefined) updates.durationType = durationType;
    if (durationDays !== undefined) updates.durationDays = Number(durationDays) || 30;
    if (customStartDate !== undefined) updates.customStartDate = customStartDate;
    if (customEndDate !== undefined) updates.customEndDate = customEndDate;

    const updated = await dbService.update('subscriptions', req.params.id, updates);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create subscription plan
router.post('/', async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      isActive,
      includedCategories,
      includedTemplateIds,
      durationType,
      durationDays,
      customStartDate,
      customEndDate
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is a required field.' });
    }

    const newPlan = await dbService.add('subscriptions', {
      name,
      price: Number(price) || 0,
      description: description || '',
      isActive: isActive !== false,
      includedCategories: Array.isArray(includedCategories) ? includedCategories : [],
      includedTemplateIds: Array.isArray(includedTemplateIds) ? includedTemplateIds : [],
      durationType: durationType || 'monthly',
      durationDays: durationDays !== undefined ? Number(durationDays) : 30,
      customStartDate: customStartDate || null,
      customEndDate: customEndDate || null
    });

    res.status(201).json(newPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE subscription plan
router.delete('/:id', async (req, res) => {
  try {
    const plan = await dbService.getOne('subscriptions', req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found.' });
    }

    await dbService.delete('subscriptions', req.params.id);
    res.json({ success: true, message: 'Subscription plan deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
