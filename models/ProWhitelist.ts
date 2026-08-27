import mongoose, { Schema, Model } from "mongoose";

/**
 * Manual allow-list for the Pro plan. There is no payment flow yet, so Pro is
 * granted purely by adding a Google account email to this collection:
 *
 *   db.prowhitelists.insertOne({ email: "someone@gmail.com", active: true, createdAt: new Date() })
 */
export interface IProWhitelist {
  email: string;
  active: boolean;
  note?: string | null;
  createdAt: Date;
}

const ProWhitelistSchema: Schema<IProWhitelist> = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  active: { type: Boolean, default: true },
  note: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

const ProWhitelist: Model<IProWhitelist> =
  mongoose.models.ProWhitelist ||
  mongoose.model<IProWhitelist>("ProWhitelist", ProWhitelistSchema);

export default ProWhitelist;
