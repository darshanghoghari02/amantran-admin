import express from 'express';
import { dbService } from '../services/db.js';

const router = express.Router();

// GET all users (with search and filter)
router.get('/', async (req, res) => {
  try {
    const list = await dbService.getAll('users');
    const { query, role } = req.query;
    let filtered = [...list];

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(u => 
        (u.displayName && u.displayName.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q))
      );
    }

    if (role) {
      filtered = filtered.filter(u => u.role === role);
    }

    // Sort by creation date or alphabet
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single user
router.get('/:id', async (req, res) => {
  try {
    const user = await dbService.getOne('users', req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update user details (e.g. block / role)
router.put('/:id', async (req, res) => {
  try {
    const { role, isBlocked } = req.body;
    const updates = {};
    if (role !== undefined) updates.role = role;
    if (isBlocked !== undefined) updates.isBlocked = isBlocked;

    const updated = await dbService.update('users', req.params.id, updates);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    await dbService.delete('users', req.params.id);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
