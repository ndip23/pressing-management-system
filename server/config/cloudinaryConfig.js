// server/config/cloudinaryConfig.js

import * as cloudinaryRoot from 'cloudinary';
import dotenv from 'dotenv';
import { createRequire } from 'module';

// Set up 'require' for older packages
const require = createRequire(import.meta.url);
const multerStoragePkg = require('multer-storage-cloudinary');
const CloudinaryStorage = multerStoragePkg.CloudinaryStorage || multerStoragePkg.default?.CloudinaryStorage || multerStoragePkg;

dotenv.config(); 

// Extract v2 for configuration and exporting
const cloudinary = cloudinaryRoot.v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, 
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinaryRoot,
    params: {
        folder: 'pressflow_profile_pics',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif']
        // 🔥 REMOVED public_id function: Cloudinary will auto-generate a safe name
    },
});

const logoStorage = new CloudinaryStorage({
    cloudinary: cloudinaryRoot,
    params: {
        folder: 'pressflow_logos',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 300, height: 300, crop: 'limit' }]
        // 🔥 REMOVED public_id function: Cloudinary will auto-generate a safe name
    },
});

export { cloudinary, storage, logoStorage };