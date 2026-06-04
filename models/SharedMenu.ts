import mongoose, { Schema, Model } from "mongoose";

export interface ISharedMenu {
  shareId: string;
  ownerEmail: string;
  ownerName: string;
  menuOrder: string[];   // slugs in display order
  pinnedSlugs: string[]; // favorited/starred slugs
  createdAt: Date;
}

const SharedMenuSchema: Schema<ISharedMenu> = new Schema({
  shareId: { type: String, required: true, unique: true },
  ownerEmail: { type: String, required: true },
  ownerName: { type: String, default: "" },
  menuOrder: { type: [String], default: [] },
  pinnedSlugs: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

const SharedMenu: Model<ISharedMenu> =
  mongoose.models.SharedMenu ||
  mongoose.model<ISharedMenu>("SharedMenu", SharedMenuSchema);

export default SharedMenu;
