import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/siddhistationery';

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  isFallback: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseGlobal: GlobalMongoose | undefined;
}

let cached = global.mongooseGlobal;

if (!cached) {
  cached = global.mongooseGlobal = { conn: null, promise: null, isFallback: false };
}

export async function dbConnect(): Promise<typeof mongoose | null> {
  if (cached?.conn) {
    return cached.conn;
  }

  if (cached?.isFallback) {
    return null;
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2000, // Short timeout to fail fast if local mongod is not running
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached!.conn = await cached!.promise;
    return cached!.conn;
  } catch (e: any) {
    cached!.promise = null;
    cached!.isFallback = true;
    console.warn(
      `⚠️ MongoDB Connection Warning (${e?.message || 'Offline'}). Falling back to in-memory store. To connect to MongoDB Atlas or local daemon, update MONGODB_URI in .env.local`
    );
    return null;
  }
}

export default dbConnect;
