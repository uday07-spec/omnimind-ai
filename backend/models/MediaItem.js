import mongoose from 'mongoose';

const mediaItemSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required']
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required']
    },
    fileType: {
      type: String,
      enum: {
        values: ['image', 'pdf', 'audio', 'video', 'text'],
        message: '{VALUE} is not a supported file type'
      },
      required: [true, 'File type is required']
    },
    originalName: {
      type: String,
      required: [true, 'Original name is required']
    },
    mimeType: {
      type: String
    },
    size: {
      type: Number
    },
    extractedText: {
      type: String,
      default: ''
    },
    aiSummary: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

mediaItemSchema.index({ projectId: 1 });

const MediaItem = mongoose.model('MediaItem', mediaItemSchema);

export default MediaItem;
