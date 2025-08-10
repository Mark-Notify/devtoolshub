import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// Extend the global type to include mongoose
declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: any; promise: Promise<any> | null } | undefined;
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached?.conn) return cached.conn;

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI as string).then((mongoose) => mongoose);
  }
  cached!.conn = await cached!.promise;
  return cached!.conn;
}
