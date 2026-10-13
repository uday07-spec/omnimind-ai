import fs from 'fs';
import path from 'path';
import Project from '../models/Project.js';
import MediaItem from '../models/MediaItem.js';
import { getFileType } from '../utils/fileHelper.js';
import { summarizeFile } from '../utils/gemini.js';

/**
 * Upload a media file to a project, analyze with Gemini, and create MediaItem
 * POST /api/projects/:id/upload
 */
export const uploadFile = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;

    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.id
    });

    if (!project) {
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          // ignore cleanup error
        }
      }
      return res.status(404).json({
        success: false,
        message: 'Project not found.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided in the upload request.'
      });
    }

    const { mimetype, originalname, size, filename, path: filePath, encoding } = req.file;
    const fileType = getFileType(mimetype);

    // Read file buffer from disk
    const fileBuffer = fs.readFileSync(filePath);

    // Summarize using Gemini
    const aiSummary = await summarizeFile(fileBuffer, mimetype, originalname);

    // Create MediaItem record
    const mediaItem = await MediaItem.create({
      projectId: project._id,
      fileUrl: `/uploads/${filename}`,
      fileType,
      originalName: originalname,
      mimeType: mimetype,
      size,
      aiSummary,
      extractedText: aiSummary,
      metadata: {
        encoding,
        filename
      }
    });

    return res.status(201).json({
      success: true,
      mediaItem
    });
  } catch (error) {
    // Clean up uploaded file if an error occurs
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // ignore cleanup error
      }
    }
    next(error);
  }
};

/**
 * Delete a media item and remove the file from disk
 * DELETE /api/projects/:id/media/:mediaId
 */
export const deleteMedia = async (req, res, next) => {
  try {
    const { id: projectId, mediaId } = req.params;

    // Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.'
      });
    }

    // Find media item within this project
    const mediaItem = await MediaItem.findOne({
      _id: mediaId,
      projectId: project._id
    });

    if (!mediaItem) {
      return res.status(404).json({
        success: false,
        message: 'Media item not found.'
      });
    }

    // Unlink file from disk if present
    if (mediaItem.fileUrl) {
      const relativePath = mediaItem.fileUrl.replace(/^\//, '');
      const absolutePath = path.resolve(process.cwd(), relativePath);
      if (fs.existsSync(absolutePath)) {
        try {
          fs.unlinkSync(absolutePath);
        } catch (err) {
          console.error(`Failed to delete media file ${absolutePath}:`, err.message);
        }
      }
    }

    await MediaItem.deleteOne({ _id: mediaItem._id });

    return res.status(200).json({
      success: true,
      message: 'Media item deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  uploadFile,
  deleteMedia
};
