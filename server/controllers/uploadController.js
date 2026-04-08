// server/controllers/uploadController.js
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Upload a file and return its Cloudinary URL and public ID
// @route   POST /api/uploads/image
// @access  Private
const uploadImage = asyncHandler(async (req, res) => {
    // 1. Validate if file exists
    if (!req.file) {
        res.status(400);
        throw new Error('No image file was uploaded.');
    }

    // 2. Extract the data safely
    // multer-storage-cloudinary attaches 'path' and 'filename' to req.file
    const imageUrl = req.file.path || req.file.secure_url;
    const cloudinaryId = req.file.filename || req.file.public_id;

    // 3. Log a clean confirmation (without printing the massive object)
    console.log(`[UploadCtrl] Successfully uploaded: ${imageUrl}`);

    // 4. Send back the response
    res.status(200).json({
        message: 'Image uploaded successfully.',
        imageUrl: imageUrl, 
        cloudinaryId: cloudinaryId,
    });
});

export { uploadImage };