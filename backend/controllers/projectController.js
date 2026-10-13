import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import Project from '../models/Project.js';
import MediaItem from '../models/MediaItem.js';
import ChatMessage from '../models/ChatMessage.js';

const createProjectSchema = z.object({
  title: z
    .string({ required_error: 'Project title is required' })
    .trim()
    .min(1, 'Project title cannot be empty'),
  description: z.string().trim().optional().default('')
});

/**
 * Get all projects belonging to the logged-in user
 * GET /api/projects
 */
export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const projectIds = projects.map((p) => p._id);

    // Count media items for each project
    const mediaCounts = await MediaItem.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $group: { _id: '$projectId', count: { $sum: 1 } } }
    ]);

    const countMap = mediaCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const enrichedProjects = projects.map((project) => ({
      ...project,
      mediaCount: countMap[project._id.toString()] || 0
    }));

    return res.status(200).json({
      success: true,
      projects: enrichedProjects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new project for the logged-in user
 * POST /api/projects
 */
export const createProject = async (req, res, next) => {
  try {
    const validatedData = createProjectSchema.parse(req.body);

    const project = await Project.create({
      userId: req.user.id,
      title: validatedData.title,
      description: validatedData.description
    });

    return res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single project with all its media items and chat history
 * GET /api/projects/:id
 */
export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.'
      });
    }

    // Retrieve media items for this project
    const mediaItems = await MediaItem.find({ projectId: project._id })
      .sort({ createdAt: -1 });

    // Retrieve chat history in chronological order
    const chatHistory = await ChatMessage.find({ projectId: project._id })
      .sort({ timestamp: 1 });

    return res.status(200).json({
      success: true,
      project,
      mediaItems,
      chatHistory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a project and its associated media items, files, and chat messages
 * DELETE /api/projects/:id
 */
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.'
      });
    }

    // Find and delete media items and their physical files
    const mediaItems = await MediaItem.find({ projectId: project._id });
    for (const item of mediaItems) {
      if (item.fileUrl) {
        const relativeFilePath = item.fileUrl.replace(/^\//, '');
        const absolutePath = path.resolve(process.cwd(), relativeFilePath);
        if (fs.existsSync(absolutePath)) {
          try {
            fs.unlinkSync(absolutePath);
          } catch (err) {
            console.error(`Failed to delete file ${absolutePath}:`, err.message);
          }
        }
      }
    }

    await MediaItem.deleteMany({ projectId: project._id });
    await ChatMessage.deleteMany({ projectId: project._id });
    await Project.deleteOne({ _id: project._id });

    return res.status(200).json({
      success: true,
      message: 'Project and all associated assets deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getProjects,
  createProject,
  getProject,
  deleteProject
};
