import mongoose from "mongoose";

const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI;
const connection = {};

async function dbConnect() {
    // check if already connected
    if(connection.isConnected()) {
        console.log('Already connected');
        return;
    }

    try {
        // try to connect to Mongoose
        const db = await mongoose.connect(MONGODB_URI || '', {});
        connection.isConnected = db.connections[0].readyState;
        console.log('Database connected successfully');
        
    } catch (error) {
        console.error('Database connection failed: ', error);
        process.exit(1);
        
    }
}

export default dbConnect;
