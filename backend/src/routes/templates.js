import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbService } from '../services/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_DIR = path.resolve(__dirname, '../..');
const ASSETS_DIR = path.join(BACKEND_DIR, 'assets');

// Helper: delete a single local file safely (only inside assets/)
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

// Helper: try to remove a directory if it's empty
function tryRemoveEmptyDir(dirPath) {
  try {
    if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
      fs.rmdirSync(dirPath);
      console.log(`📁 Removed empty folder: ${dirPath}`);
    }
  } catch (err) {
    // ignore — not critical
  }
}

const router = express.Router();

// GET all templates
router.get('/', async (req, res) => {
  try {
    const list = await dbService.getAll('templates');
    // Optional filter by category
    const { categoryId } = req.query;
    if (categoryId) {
      const filtered = list.filter(t => t.categoryId === categoryId);
      return res.json(filtered);
    }
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single template
router.get('/:id', async (req, res) => {
  try {
    const template = await dbService.getOne('templates', req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create template
router.post('/', async (req, res) => {
  try {
    const {
      categoryId,
      name,
      slug,
      thumbnail,
      previewImages,
      localAssetPaths,
      isPremium,
      isActive,
      fonts,
      languages,
      pages
    } = req.body;

    if (!categoryId || !name || !slug) {
      return res.status(400).json({ error: 'Category, name, and slug are required fields.' });
    }

    const newTemplate = await dbService.add('templates', {
      categoryId,
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      thumbnail: thumbnail || '',
      previewImages: previewImages || [],
      localAssetPaths: localAssetPaths || [],
      isPremium: isPremium === true,
      isActive: isActive !== false,
      fonts: fonts || [],
      languages: languages || [],
      pages: pages || []
    });

    res.status(201).json(newTemplate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update template
router.put('/:id', async (req, res) => {
  try {
    const {
      categoryId,
      name,
      slug,
      thumbnail,
      previewImages,
      localAssetPaths,
      isPremium,
      isActive,
      fonts,
      languages,
      pages
    } = req.body;

    const updates = {};
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (thumbnail !== undefined) updates.thumbnail = thumbnail;
    if (previewImages !== undefined) updates.previewImages = previewImages;
    if (localAssetPaths !== undefined) updates.localAssetPaths = localAssetPaths;
    if (isPremium !== undefined) updates.isPremium = isPremium;
    if (isActive !== undefined) updates.isActive = isActive;
    if (fonts !== undefined) updates.fonts = fonts;
    if (languages !== undefined) updates.languages = languages;
    if (pages !== undefined) updates.pages = pages;

    const updated = await dbService.update('templates', req.params.id, updates);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST duplicate template
router.post('/:id/duplicate', async (req, res) => {
  try {
    const original = await dbService.getOne('templates', req.params.id);
    if (!original) {
      return res.status(404).json({ error: 'Original template not found' });
    }

    const uniqueId = `tpl_${Math.random().toString(36).substr(2, 9)}`;
    const clonedTemplate = {
      ...original,
      id: uniqueId,
      name: `${original.name} (Copy)`,
      slug: `${original.slug}_copy_${Date.now()}`,
      isActive: false // duplicated templates are draft by default
    };

    delete clonedTemplate.createdAt;
    delete clonedTemplate.updatedAt;

    const savedClone = await dbService.add('templates', clonedTemplate);
    res.status(201).json(savedClone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE template (+ delete ALL its image files from disk)
router.delete('/:id', async (req, res) => {
  try {
    // Step 1: Fetch template to get all asset paths before deleting
    const template = await dbService.getOne('templates', req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    // Step 2: Collect all file paths to delete
    const allPaths = new Set();

    // localAssetPaths has the canonical list (flutter-style paths)
    if (Array.isArray(template.localAssetPaths)) {
      template.localAssetPaths.forEach(p => allPaths.add(p));
    }
    // Also include thumbnail and previewImages in case they differ
    if (template.thumbnail) allPaths.add(template.thumbnail);
    if (Array.isArray(template.previewImages)) {
      template.previewImages.forEach(p => allPaths.add(p));
    }

    // Step 3: Delete each file from disk
    allPaths.forEach(filePath => deleteLocalFile(filePath));

    // Step 4: Try to remove the now-empty template folder
    if (template.slug) {
      // Template images are stored under assets/images/<categorySlug>/<templateSlug>/
      // Find the category to get its slug
      const category = await dbService.getOne('categories', template.categoryId).catch(() => null);
      if (category?.slug) {
        const templateDir = path.join(BACKEND_DIR, 'assets', 'images', category.slug, template.slug);
        tryRemoveEmptyDir(templateDir);
      }
    }

    // Step 5: Delete DB record
    await dbService.delete('templates', req.params.id);
    res.json({
      success: true,
      message: `Template deleted. ${allPaths.size} asset file(s) removed from disk.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
