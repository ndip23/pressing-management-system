// server/controllers/galleryController.js
import Gallery from '../models/Gallery.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { cloudinary } from '../config/cloudinaryConfig.js';

export const uploadGalleryImage = asyncHandler(async (req, res) => {
    const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : null);
    if (!uploadedFile) throw new Error('No image file provided');
    
    // Ensure tenantId exists
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new Error('User is not associated with any tenant');

    // Cloudinary storage puts info in req.file.path and req.file.filename
    const gallery = await Gallery.create({
        tenantId,
        imageUrl: uploadedFile.path || uploadedFile.secure_url,
        cloudinaryId: uploadedFile.filename || uploadedFile.public_id,
        caption: req.body.caption || ''
    });
    
    res.status(201).json(gallery);
});

export const getGalleryByTenant = asyncHandler(async (req, res) => {
    const gallery = await Gallery.find({ tenantId: req.params.tenantId });
    res.json(gallery);
});

export const deleteGalleryImage = asyncHandler(async (req, res) => {
    const image = await Gallery.findById(req.params.id);
    if (!image) throw new Error('Image not found');
    
    // Safely destroy the image
    if (image.cloudinaryId) {
        await cloudinary.uploader.destroy(image.cloudinaryId);
    }
    
    await image.deleteOne();
    res.json({ message: 'Image removed' });
});