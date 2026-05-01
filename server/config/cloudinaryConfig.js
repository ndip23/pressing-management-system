import cloudinaryPackage from 'cloudinary';
import dotenv from 'dotenv';
import multerStorageCloudinary from 'multer-storage-cloudinary';

dotenv.config();

const cloudinary = cloudinaryPackage.v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const storage = multerStorageCloudinary({
    cloudinary: cloudinaryPackage,
    params: {
        folder: 'pressflow_gallery',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    },
});

const logoStorage = multerStorageCloudinary({
    cloudinary: cloudinaryPackage,
    params: {
        folder: 'pressflow_logos',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 300, height: 300, crop: 'limit' }],
    },
});

export { cloudinary, storage, logoStorage };