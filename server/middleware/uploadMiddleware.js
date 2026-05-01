import multer from 'multer';
import { storage, logoStorage } from '../config/cloudinaryConfig.js';

// Create separate instances
export const uploadProfile = multer({ storage });     // For profile pictures
export const uploadLogo = multer({ storage: logoStorage }); // For business logos
export const uploadGallery = multer({ storage }); // For gallery images