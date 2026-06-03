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
      includedTemplateIds
    } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (price !== undefined) updates.price = Number(price) || 0;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive === true;
    if (includedCategories !== undefined) updates.includedCategories = Array.isArray(includedCategories) ? includedCategories : [];
    if (includedTemplateIds !== undefined) updates.includedTemplateIds = Array.isArray(includedTemplateIds) ? includedTemplateIds : [];

    const updated = await dbService.update('subscriptions', req.params.id, updates);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
