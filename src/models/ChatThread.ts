import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChatThread extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatThreadSchema = new Schema<IChatThread>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index for faster user-based queries
    },
    title: {
      type: String,
      default: 'New Chat',
      trim: true,
      maxlength: 200,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Compound index for efficient user thread queries
chatThreadSchema.index({ userId: 1, updatedAt: -1 });

// Prevent duplicate model registration during development
export const ChatThread = mongoose.models.ChatThread || mongoose.model<IChatThread>('ChatThread', chatThreadSchema);

// Export TypeScript type for use in other files
export type ChatThreadType = IChatThread; 