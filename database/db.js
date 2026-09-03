import dns from 'dns';
import mongoose from "mongoose";

const dbConnection = async () => {
    try {
        dns.setServers(["1.1.1.1"]);
        await mongoose.connect(process.env.MONGODB_URL)
    } catch (error) {
        console.log(error);
        process.exit(1)
    }
}

export default dbConnection