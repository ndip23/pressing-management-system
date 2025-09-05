// server/controllers/uploadController.js
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Upload a file and return its Cloudinary URL and public ID
// @route   POST /api/uploads/image
// @access  Private (protected by the route that uses it)
const uploadImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No image file was uploaded.');
    }

    console.log('[UploadCtrl] File successfully uploaded to Cloudinary:', req.file);

    // Send back the necessary information for the frontend to use
    res.status(200).json({
        message: 'Image uploaded successfully.',
        imageUrl: req.file.path, // The secure URL from Cloudinary
        cloudinaryId: req.file.filename, // The public_id from Cloudinary
    });
});

export { uploadImage };