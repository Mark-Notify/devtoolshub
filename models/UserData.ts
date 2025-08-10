import mongoose from "mongoose";

const UserDataSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  tool: String,         // ชื่อเครื่องมือที่ใช้ เช่น JSON Formatter
  inputData: String,    // ข้อมูลต้นฉบับ
  outputData: String,   // ข้อมูลที่แปลงแล้ว
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.UserData || mongoose.model("UserData", UserDataSchema);
