import mongoose, { Schema, Model } from "mongoose";

export interface ITempAttachment {
  filename: string;
  contentType: string;
  size: number;
  /** base64 payload — only kept for Pro mailboxes within the size caps. */
  content?: string | null;
  stored: boolean;
}

export interface ITempMessage {
  mailboxId: mongoose.Types.ObjectId;
  address: string;
  messageId?: string | null;
  fromName?: string | null;
  fromAddress: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  preview: string;
  attachments: ITempAttachment[];
  hadAttachments: boolean;
  size: number;
  read: boolean;
  receivedAt: Date;
  expiresAt: Date;
}

const TempAttachmentSchema = new Schema<ITempAttachment>(
  {
    filename: { type: String, default: "attachment" },
    contentType: { type: String, default: "application/octet-stream" },
    size: { type: Number, default: 0 },
    content: { type: String, default: null },
    stored: { type: Boolean, default: false },
  },
  { _id: false }
);

const TempMessageSchema: Schema<ITempMessage> = new Schema({
  mailboxId: { type: Schema.Types.ObjectId, ref: "TempMailbox", required: true, index: true },
  address: { type: String, required: true, lowercase: true, index: true },
  messageId: { type: String, default: null },
  fromName: { type: String, default: null },
  fromAddress: { type: String, default: "unknown@unknown" },
  to: { type: String, default: "" },
  subject: { type: String, default: "(no subject)" },
  text: { type: String, default: "" },
  html: { type: String, default: "" },
  preview: { type: String, default: "" },
  attachments: { type: [TempAttachmentSchema], default: [] },
  hadAttachments: { type: Boolean, default: false },
  size: { type: Number, default: 0 },
  read: { type: Boolean, default: false },
  receivedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

TempMessageSchema.index({ address: 1, receivedAt: -1 });
TempMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TempMessage: Model<ITempMessage> =
  mongoose.models.TempMessage ||
  mongoose.model<ITempMessage>("TempMessage", TempMessageSchema);

export default TempMessage;
