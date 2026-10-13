import { Router } from 'express';
import {
  register,
  login,
  logout,
  me
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Public authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected user profile route
router.get('/me', protect, me);

export default router;
