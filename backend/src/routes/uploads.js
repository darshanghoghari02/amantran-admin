import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { upload } from '../middleware/upload.js';
import { dbService } from '../services/db.js';
import admin from 'firebase-admin';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_DIR = path.resolve(__dirname, '../..');
const ASSETS_DIR = path.join(BACKEND_DIR, 'assets');

// Helper to upload a single local file to Firebase Storage and delete local file on success
async function uploadToFirebaseStorage(localFilePath, mimeType) {
  if (!dbService.isFirebase) return null;
  
  try {
    const bucket = admin.storage().bucket();
    const relativePathOnDisk = path.relative(ASSETS_DIR, localFilePath).replace(/\\/g, '/');
    const destination = `assets/${relativePathOnDisk}`;

    await bucket.upload(localFilePath, {
      destination: destination,
      public: true,
      metadata: {
        contentType: mimeType
      }
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;
    
    // Clean up local file from disk after successful cloud upload
    try {
      fs.unlinkSync(localFilePath);
    } catch (e) {
      console.warn(`⚠️ Failed to delete local temp file at ${localFilePath}:`, e.message);
    }

    return publicUrl;
  } catch (err) {
    console.error("⚠️ Firebase Storage upload failed, falling back to local file path:", err.message);
    return null;
  }
}

// Endpoint: POST upload single file
router.post('/single', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Try uploading to Firebase Storage first
    const cloudUrl = await uploadToFirebaseStorage(req.file.path, req.file.mimetype);

    if (cloudUrl) {
      return res.json({
        success: true,
        message: 'File uploaded successfully to cloud!',
        filePath: cloudUrl,
        flutterPath: cloudUrl,
        fileName: req.file.filename,
        size: req.file.size
      });
    }

    // Fallback: Local disk path resolution
    const relativePath = path.relative(BACKEND_DIR, req.file.path).replace(/\\/g, '/');
    const webUrl = `/${relativePath}`;
    const flutterPath = relativePath;

    res.json({
      success: true,
      message: 'File uploaded successfully to local storage fallback!',
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

    const uploadedFiles = [];

    for (const file of req.files) {
      const cloudUrl = await uploadToFirebaseStorage(file.path, file.mimetype);

      if (cloudUrl) {
        uploadedFiles.push({
          filePath: cloudUrl,
          flutterPath: cloudUrl,
          fileName: file.filename,
          size: file.size
        });
      } else {
        const relativePath = path.relative(BACKEND_DIR, file.path).replace(/\\/g, '/');
        uploadedFiles.push({
          filePath: `/${relativePath}`,
          flutterPath: relativePath,
          fileName: file.filename,
          size: file.size
        });
      }
    }

    res.json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully!`,
      files: uploadedFiles
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: DELETE remove an asset file
router.delete('/', async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'filePath parameter is required.' });
    }

    // If it's a cloud Firebase Storage URL, delete from cloud
    if (filePath.startsWith('https://firebasestorage.googleapis.com')) {
      if (dbService.isFirebase) {
        try {
          const bucket = admin.storage().bucket();
          // Extract file path from URL
          const decodedPath = decodeURIComponent(filePath.split('/o/')[1].split('?')[0]);
          await bucket.file(decodedPath).delete();
          return res.json({ success: true, message: `Cloud file ${decodedPath} deleted successfully.` });
        } catch (err) {
          console.error("Failed to delete cloud file:", err.message);
          return res.status(500).json({ error: `Failed to delete cloud file: ${err.message}` });
        }
      } else {
        return res.status(400).json({ error: 'Firebase is not active. Cannot delete cloud file.' });
      }
    }

    // Fallback: Delete local file
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const absolutePath = path.join(BACKEND_DIR, cleanPath);

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
