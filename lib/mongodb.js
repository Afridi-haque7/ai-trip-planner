import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

let clientPromise;

export function getClientPromise() {
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }
  
  if (clientPromise) return clientPromise;

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    clientPromise = client.connect();
  }

  return clientPromise;
}