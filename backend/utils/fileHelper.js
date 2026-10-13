import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '..', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Determines media fileType category based on MIME type
 * @param {string} mimeType
 * @returns {'image' | 'pdf' | 'audio' | 'video' | 'text'}
 */
export function getFileType(mimeType) {
  if (!mimeType) return 'text';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return 'text';
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${sanitizedName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimePrefixes = ['image/', 'audio/', 'video/', 'text/'];
  const allowedExactMimes = [
    'application/pdf',
    'application/json',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const matchesPrefix = allowedMimePrefixes.some((prefix) =>
    file.mimetype.startsWith(prefix)
  );

  if (matchesPrefix || allowedExactMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not supported.`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  }
});

export default {
  getFileType,
  upload
};
