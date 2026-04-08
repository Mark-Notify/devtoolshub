import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFavorite extends Document {
  userEmail: string;
  toolKey: string;
  createdAt: Date;
}

const FavoriteSchema: Schema<IFavorite> = new Schema({
  userEmail: { type: String, required: true },
  toolKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Compound unique index to prevent duplicate favorites
FavoriteSchema.index({ userEmail: 1, toolKey: 1 }, { unique: true });

const Favorite: Model<IFavorite> =
  mongoose.models.Favorite ||
  mongoose.model<IFavorite>("Favorite", FavoriteSchema);

export default Favorite;
