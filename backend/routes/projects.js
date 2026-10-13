import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { upload } from '../utils/fileHelper.js';
import {
  getProjects,
  createProject,
  getProject,
  deleteProject
} from '../controllers/projectController.js';
import {
  uploadFile,
  deleteMedia
} from '../controllers/uploadController.js';
import {
  sendMessage,
  synthesize
} from '../controllers/chatController.js';

const router = Router();

// Protect all project routes
router.use(protect);

// Project management routes
router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.delete('/:id', deleteProject);

// Media management routes
router.post('/:id/upload', upload.single('file'), uploadFile);
router.delete('/:id/media/:mediaId', deleteMedia);

// Chat and synthesis routes
router.post('/:id/chat', sendMessage);
router.post('/:id/synthesize', synthesize);

export default router;
