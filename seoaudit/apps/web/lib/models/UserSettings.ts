import mongoose from 'mongoose';

export interface IUserSettings {
  _id: mongoose.Types.ObjectId;
  userId: string;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  emailNotifications?: boolean;
  weeklyReport?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSettingsSchema = new mongoose.Schema<IUserSettings>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    language: {
      type: String,
      default: 'en',
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    weeklyReport: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.UserSettings || mongoose.model<IUserSettings>('UserSettings', userSettingsSchema);
