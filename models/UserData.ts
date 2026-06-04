import mongoose, { Schema, Model } from "mongoose";

export interface IUserData {
  userEmail: string;
  tool?: string;
  inputData?: string;
  outputData?: string;
  shareId?: string;
  createdAt: Date;
}

const UserDataSchema: Schema<IUserData> = new Schema({
  userEmail: { type: String, required: true },
  tool: { type: String },
  inputData: { type: String },
  outputData: { type: String },
  shareId: { type: String, sparse: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

const UserData: Model<IUserData> =
  mongoose.models.UserData || mongoose.model<IUserData>("UserData", UserDataSchema);

export default UserData;
