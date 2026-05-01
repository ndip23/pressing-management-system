import express from 'express';
import { uploadGallery } from '../middleware/uploadMiddleware.js';
import { uploadGalleryImage, getGalleryByTenant, deleteGalleryImage } from '../controllers/galleryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/upload', protect, uploadGallery.single('image'), uploadGalleryImage);
router.get('/:tenantId', getGalleryByTenant);
router.delete('/:id', protect, deleteGalleryImage);

export default router;