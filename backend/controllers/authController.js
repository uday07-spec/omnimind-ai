import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';

// Validation schemas
const registerSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .trim()
    .min(3, 'Username must be at least 3 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
});

const getJwtSecret = () => process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { username, email, password } = validatedData;

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username is already taken.'
      });
    }

    // Create user (password is hashed by pre-save/pre-validate hooks)
    const user = new User({
      username,
      email: email.toLowerCase(),
      password
    });
    await user.save();

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie
    res.cookie('token', token, cookieOptions);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // Set httpOnly cookie
    res.cookie('token', token, cookieOptions);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out user by clearing the auth token cookie
 * POST /api/auth/logout
 */
export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

/**
 * Get currently authenticated user details
 * GET /api/auth/me
 */
export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  logout,
  me
};
