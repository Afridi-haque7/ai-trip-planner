import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in environment variables");
}

let cached = (global).mongoClient ?? {};

(global).mongoClient = cached;

async function connectMongo() {
  if (cached.client) return cached.client;

  if (!cached.promise) {
    cached.promise = MongoClient.connect(MONGODB_URI, {
      maxPoolSize: 10,
    });
  }

  cached.client = await cached.promise;
  return cached.client;
}

export default connectMongo;