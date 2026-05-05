import mongoose, { Schema, Model } from "mongoose";

export interface ISavedSnippet {
  userEmail: string;
  toolKey: string;
  title: string;
  content: string;
  isFavorite: boolean;
  createdAt: Date;
}

const SavedSnippetSchema: Schema<ISavedSnippet> = new Schema({
  userEmail: { type: String, required: true },
  toolKey: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  isFavorite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const SavedSnippet: Model<ISavedSnippet> =
  mongoose.models.SavedSnippet ||
  mongoose.model<ISavedSnippet>("SavedSnippet", SavedSnippetSchema);

export default SavedSnippet;
