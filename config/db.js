import mongoose from 'mongoose';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ DB error:', err.message);
    process.exit(1);
  }
};
export default connectDB;