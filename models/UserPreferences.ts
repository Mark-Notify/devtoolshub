import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserPreferences extends Document {
  userEmail: string;
  theme: string;
  jsonIndent: number;
  autoCopy: boolean;
  sidebarCollapsed: boolean;
  defaultTool: string;
  updatedAt: Date;
}

const UserPreferencesSchema: Schema<IUserPreferences> = new Schema({
  userEmail: { type: String, required: true, unique: true },
  theme: { type: String, default: "dark" },
  jsonIndent: { type: Number, default: 2 },
  autoCopy: { type: Boolean, default: false },
  sidebarCollapsed: { type: Boolean, default: false },
  defaultTool: { type: String, default: "json-format-vertical" },
  updatedAt: { type: Date, default: Date.now },
});

const UserPreferences: Model<IUserPreferences> =
  mongoose.models.UserPreferences ||
  mongoose.model<IUserPreferences>("UserPreferences", UserPreferencesSchema);

export default UserPreferences;
