import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required']
    },
    sender: {
      type: String,
      enum: {
        values: ['user', 'ai'],
        message: '{VALUE} is not a valid sender (must be "user" or "ai")'
      },
      required: [true, 'Sender is required']
    },
    content: {
      type: String,
      required: [true, 'Message content is required']
    },
    attachedMediaIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MediaItem'
      }
    ],
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

chatMessageSchema.index({ projectId: 1, timestamp: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
