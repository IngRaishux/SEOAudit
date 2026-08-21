import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

const globalForMongoose = globalThis as unknown as {
  __mongoose?: {
    conn?: typeof mongoose;
    promise?: Promise<typeof mongoose>;
  };
};

let cached = globalForMongoose.__mongoose;
if (!cached) {
  cached = globalForMongoose.__mongoose = {};
}

async function connectMongoose() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(uri as string, {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = undefined;
    throw e;
  }

  return cached!.conn;
}

export default connectMongoose;
