import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { createRequire } from 'module';

// 1. Set up 'require'
const require = createRequire(import.meta.url);

// 2. Load the library package
const multerStoragePkg = require('multer-storage-cloudinary');

// 3. SAFELY extract the Constructor
// This line checks if .CloudinaryStorage exists, otherwise it uses the package itself.
// This fixes the "is not a constructor" error.
const CloudinaryStorage = multerStoragePkg.CloudinaryStorage || multerStoragePkg.default?.CloudinaryStorage || multerStoragePkg;

dotenv.config(); 

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, 
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'pressflow_profile_pics',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
        public_id: (req, file) => `user_${req.user ? req.user.id : 'guest'}_${Date.now()}`, 
    },
});

const logoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'pressflow_logos',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 300, height: 300, crop: 'limit' }],
    },
});

export { cloudinary, storage, logoStorage };