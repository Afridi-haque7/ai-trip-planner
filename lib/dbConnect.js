import mongoose from "mongoose";

const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI;

if(!MONGODB_URI){
    throw new Error("Please define valid MONGO URI")
}

let cached = global.mongoose;
if(!cached) {
    cached = global.mongoose = { conn : null, promise: null};
}
async function dbConnect() {
    // check if already connected
    if(cached.conn){
        return cached.conn;
    }

    if(!cached.promise){
        const opts = { 
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };

        cached.promise = mongoose
        .connect(MONGODB_URI, opts)
        .then((mongoose) => {
            return mongoose;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

export default dbConnect;
