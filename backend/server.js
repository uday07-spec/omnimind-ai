import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/omnimind';

// Middleware configuration
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'OmniMind AI Backend',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Mount application API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// 404 fallback for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found on path: ${req.originalUrl}`
  });
});

// Global error handling middleware
app.use(errorHandler);

// Connect to MongoDB and start HTTP server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`[Database] MongoDB successfully connected to ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`[Server] OmniMind AI server running on port ${PORT}`);
      console.log(`[Server] Allowed Client Origin: ${CLIENT_ORIGIN}`);
    });
  })
  .catch((err) => {
    console.error(`[Database Error] Failed to connect to MongoDB: ${err.message}`);
    // Start server even if MongoDB is delayed so routes and healthchecks remain responsive
    app.listen(PORT, () => {
      console.log(`[Server] OmniMind AI server running on port ${PORT} (Database pending connection)`);
    });
  });

export default app;
