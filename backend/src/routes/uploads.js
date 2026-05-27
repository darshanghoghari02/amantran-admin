import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { upload } from '../middleware/upload.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_DIR = path.resolve(__dirname, '../..');
const ASSETS_DIR = path.join(BACKEND_DIR, 'assets');

// Endpoint: POST upload single file
router.post('/single', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Translate absolute disk path to standard relative web paths and flutter paths
    const relativePath = path.relative(BACKEND_DIR, req.file.path).replace(/\\/g, '/');
    
    // Web URL path starts with leading slash
    const webUrl = `/${relativePath}`;
    
    // Flutter expects exactly "assets/images/..." or "assets/fonts/..."
    const flutterPath = relativePath;

    res.json({
      success: true,
      message: 'File uploaded successfully!',
      filePath: webUrl,
      flutterPath: flutterPath,
      fileName: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: POST upload multiple files
router.post('/multiple', upload.array('files', 15), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const uploadedFiles = req.files.map(file => {
      const relativePath = path.relative(BACKEND_DIR, file.path).replace(/\\/g, '/');
      return {
        filePath: `/${relativePath}`,
        flutterPath: relativePath,
        fileName: file.filename,
        size: file.size
      };
    });

    res.json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully!`,
      files: uploadedFiles
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: DELETE remove a local asset file
router.delete('/', async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'filePath parameter is required.' });
    }

    // Clean leading slash to find local file
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const absolutePath = path.join(BACKEND_DIR, cleanPath);

    // Safeguard: make sure we are deleting files only inside our assets directory
    if (!absolutePath.startsWith(ASSETS_DIR)) {
      return res.status(403).json({ error: 'Access denied. You can only delete files inside the assets directory.' });
    }

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      res.json({ success: true, message: `File at ${filePath} deleted successfully.` });
    } else {
      res.status(404).json({ error: `File at ${filePath} does not exist.` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
