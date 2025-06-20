import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  threadId: Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    threadId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatThread',
      required: true,
      index: true, // Index for faster thread-based queries
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50000, // Allow long AI responses
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Compound index for efficient thread message queries
chatMessageSchema.index({ threadId: 1, createdAt: 1 });

// Prevent duplicate model registration during development
export const ChatMessage = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);

// Export TypeScript type for use in other files
export type ChatMessageType = IChatMessage; 