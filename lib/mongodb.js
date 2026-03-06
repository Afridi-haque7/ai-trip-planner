// lib/mongodb.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // In development, use a global variable to preserve the client across HMR
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new client but cache the promise
  client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
  });
  clientPromise = client.connect();
}

export default clientPromise;