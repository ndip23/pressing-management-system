import rateLimit from 'express-rate-limit';

const windowMs = 15 * 60 * 1000;

export const publicPostLimiter = rateLimit({
  windowMs,
  max: process.env.NODE_ENV === 'production' ? 30 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

export const directoryAdminLoginLimiter = rateLimit({
  windowMs,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});
