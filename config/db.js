<<<<<<< HEAD
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import mongoose from 'mongoose';
=======
import mongoose from "mongoose";
>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
<<<<<<< HEAD
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ DB error:', err.message);
=======
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ DB error:", error.message);
>>>>>>> c702801961d86c6b8bcf35daa24685d65d39ef0d
    process.exit(1);
  }
};

export default connectDB;