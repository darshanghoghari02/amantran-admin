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

// POST create a new user
router.post('/', async (req, res) => {
  try {
    const { email, displayName, role, password } = req.body;
    if (!email || !displayName || !role) {
      return res.status(400).json({ error: 'Email, display name, and role are required fields.' });
    }

    const newUser = await dbService.add('users', {
      email,
      displayName,
      role,
      password: password || '123456',
      isBlocked: false,
      invitationCount: 0,
      draftsCount: 0
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required fields.' });
    }

    // 1. Support default developer credentials
    if (email.toLowerCase() === 'admin@amantran.com' && password === 'admin123') {
      return res.json({
        id: 'admin_super',
        email: 'admin@amantran.com',
        displayName: 'Super Admin',
        role: 'super_admin',
        isBlocked: false,
        invitationCount: 18,
        draftsCount: 6,
        createdAt: new Date().toISOString()
      });
    }

    // 2. Otherwise query database
    const users = await dbService.getAll('users');
    const matchedUser = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

    if (!matchedUser) {
      return res.status(400).json({ error: 'Incorrect email or password.' });
    }

    if (matchedUser.isBlocked) {
      return res.status(403).json({ error: 'Your account has been suspended.' });
    }

    const storedPassword = matchedUser.password || '123456';
    if (storedPassword !== password) {
      return res.status(400).json({ error: 'Incorrect email or password.' });
    }

    res.json(matchedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update user details (e.g. block / role / name / email / password)
router.put('/:id', async (req, res) => {
  try {
    const { displayName, email, role, isBlocked, password } = req.body;
    const updates = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (isBlocked !== undefined) updates.isBlocked = isBlocked;
    if (password !== undefined) updates.password = password;

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
