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

// GET all fonts
router.get('/', async (req, res) => {
  try {
    const list = await dbService.getAll('fonts');
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add font registry
router.post('/', async (req, res) => {
  try {
    const { family, localPath, isActive } = req.body;
    if (!family || !localPath) {
      return res.status(400).json({ error: 'Family and localPath are required.' });
    }
    const newFont = await dbService.add('fonts', {
      family,
      localPath,
      isActive: isActive !== false
    });
    res.status(201).json(newFont);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update font
router.put('/:id', async (req, res) => {
  try {
    const { family, localPath, isActive } = req.body;
    const updates = {};
    if (family !== undefined) updates.family = family;
    if (localPath !== undefined) updates.localPath = localPath;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await dbService.update('fonts', req.params.id, updates);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE font (+ delete the actual .ttf file from disk)
router.delete('/:id', async (req, res) => {
  try {
    // Step 1: Fetch font to get localPath before deleting
    const font = await dbService.getOne('fonts', req.params.id);
    if (!font) {
      return res.status(404).json({ error: 'Font not found.' });
    }

    // Step 2: Delete the font file from disk
    if (font.localPath) {
      deleteLocalFile(font.localPath);
    }

    // Step 3: Delete DB record
    await dbService.delete('fonts', req.params.id);
    res.json({ success: true, message: 'Font and its file deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
