import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbService } from '../services/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_DIR = path.resolve(__dirname, '../..');
const ASSETS_DIR = path.join(BACKEND_DIR, 'assets');

// Helper: delete a local file safely (only inside assets/)
function deleteLocalFile(filePath) {
  if (!filePath) return;
  try {
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const absolutePath = path.join(BACKEND_DIR, cleanPath);
    if (absolutePath.startsWith(ASSETS_DIR) && fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log(`🗑️ Deleted file: ${absolutePath}`);
    }
  } catch (err) {
    console.warn(`⚠️ Could not delete file ${filePath}:`, err.message);
  }
}

const router = express.Router();

// GET all categories
router.get('/', async (req, res) => {
  try {
    const list = await dbService.getAll('categories');
    // Sort by displayOrder
    list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single category
router.get('/:id', async (req, res) => {
  try {
    const category = await dbService.getOne('categories', req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create category
router.post('/', async (req, res) => {
  try {
    const { name, slug, imageUrl, displayOrder, isActive } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required fields.' });
    }
    const newCategory = await dbService.add('categories', {
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      imageUrl: imageUrl || '',
      displayOrder: parseInt(displayOrder) || 1,
      isActive: isActive !== false
    });
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update category
router.put('/:id', async (req, res) => {
  try {
    const { name, slug, imageUrl, displayOrder, isActive } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (displayOrder !== undefined) updates.displayOrder = parseInt(displayOrder);
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await dbService.update('categories', req.params.id, updates);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE category (+ delete its image file from disk)
router.delete('/:id', async (req, res) => {
  try {
    // Step 1: Fetch category to get imageUrl before deleting
    const category = await dbService.getOne('categories', req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Step 2: Delete image file from disk
    if (category.imageUrl) {
      deleteLocalFile(category.imageUrl);
    }

    // Step 3: Delete DB record
    await dbService.delete('categories', req.params.id);
    res.json({ success: true, message: 'Category and its image deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
