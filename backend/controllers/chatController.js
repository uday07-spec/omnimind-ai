import { z } from 'zod';
import Project from '../models/Project.js';
import MediaItem from '../models/MediaItem.js';
import ChatMessage from '../models/ChatMessage.js';
import { chatWithContext, synthesizeAll } from '../utils/gemini.js';

const sendMessageSchema = z.object({
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(1, 'Message cannot be empty'),
  mediaIds: z.array(z.string()).optional().default([])
});

/**
 * Send a chat message, query Gemini with context, and store both messages
 * POST /api/projects/:id/chat
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const validatedData = sendMessageSchema.parse(req.body);

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

    // Fetch targeted media items or default to all project media items
    let mediaItems = [];
    if (validatedData.mediaIds && validatedData.mediaIds.length > 0) {
      mediaItems = await MediaItem.find({
        _id: { $in: validatedData.mediaIds },
        projectId: project._id
      });
    } else {
      mediaItems = await MediaItem.find({ projectId: project._id });
    }

    // Retrieve last 20 messages for conversational context
    const recentHistory = await ChatMessage.find({ projectId: project._id })
      .sort({ timestamp: -1 })
      .limit(20);
    const chronologicalHistory = recentHistory.reverse();

    // Persist the user message
    const userMessage = await ChatMessage.create({
      projectId: project._id,
      sender: 'user',
      content: validatedData.message,
      attachedMediaIds: validatedData.mediaIds || []
    });

    // Call Gemini with context
    const aiContent = await chatWithContext(
      validatedData.message,
      mediaItems,
      chronologicalHistory
    );

    // Persist the AI response
    const aiMessage = await ChatMessage.create({
      projectId: project._id,
      sender: 'ai',
      content: aiContent,
      attachedMediaIds: validatedData.mediaIds || []
    });

    return res.status(201).json({
      success: true,
      userMessage,
      aiMessage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Synthesize all project media into a structured executive summary
 * POST /api/projects/:id/synthesize
 */
export const synthesize = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;

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

    // Get all media items for the project
    const mediaItems = await MediaItem.find({ projectId: project._id });

    if (!mediaItems || mediaItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No media items found for this project to synthesize. Please upload at least one file.'
      });
    }

    // Generate comprehensive synthesis report
    const synthesis = await synthesizeAll(mediaItems);

    // Save as an AI chat message
    const message = await ChatMessage.create({
      projectId: project._id,
      sender: 'ai',
      content: synthesis,
      attachedMediaIds: mediaItems.map((item) => item._id)
    });

    return res.status(200).json({
      success: true,
      synthesis,
      message
    });
  } catch (error) {
    next(error);
  }
};

export default {
  sendMessage,
  synthesize
};
