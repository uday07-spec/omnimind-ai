import multer from 'multer';
import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors = undefined;

  // Handle Zod validation errors
  if (err instanceof ZodError || err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
  }
  // Handle Multer errors
  else if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size limit exceeded (maximum 50MB)';
    } else {
      message = `File upload error: ${err.message}`;
    }
  }
  // Handle Mongoose Validation Error
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Database validation failed';
    errors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message
    }));
  }
  // Handle Mongoose Cast Error (invalid ObjectId, etc.)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field "${err.path}": ${err.value}`;
  }
  // Handle Mongoose duplicate key error (11000)
  else if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${duplicatedField}.`;
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  // Response payload
  const response = {
    success: false,
    message
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  // Log server errors for monitoring
  if (statusCode >= 500) {
    console.error(`[Unhandled Error] ${err.stack || err}`);
  }

  return res.status(statusCode).json(response);
};

export default errorHandler;
