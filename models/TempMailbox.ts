import mongoose, { Schema, Model } from "mongoose";

export type MailPlan = "free" | "pro";

export interface ITempMailbox {
  address: string;
  localPart: string;
  domain: string;
  /** Anonymous owner id stored in the `tm_owner` httpOnly cookie. */
  ownerKey: string;
  /** Google account email when the mailbox was created while signed in. */
  userEmail?: string | null;
  plan: MailPlan;
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
  messageCount: number;
}

const TempMailboxSchema: Schema<ITempMailbox> = new Schema({
  address: { type: String, required: true, unique: true, lowercase: true, trim: true },
  localPart: { type: String, required: true, lowercase: true, trim: true },
  domain: { type: String, required: true, lowercase: true, trim: true },
  ownerKey: { type: String, required: true, index: true },
  userEmail: { type: String, default: null, index: true },
  plan: { type: String, enum: ["free", "pro"], default: "free" },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  lastSeenAt: { type: Date, default: Date.now },
  messageCount: { type: Number, default: 0 },
});

// MongoDB's TTL monitor drops the document once `expiresAt` passes — this is the
// "Redis TTL" of the architecture, no extra service required.
TempMailboxSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TempMailbox: Model<ITempMailbox> =
  mongoose.models.TempMailbox ||
  mongoose.model<ITempMailbox>("TempMailbox", TempMailboxSchema);

export default TempMailbox;
