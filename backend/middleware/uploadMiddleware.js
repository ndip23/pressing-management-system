// server/middleware/uploadMiddleware.js
import multer from 'multer';
import { storage, logoStorage } from '../config/cloudinaryConfig.js';

const upload = multer({ storage, logoStorage });

export default upload;