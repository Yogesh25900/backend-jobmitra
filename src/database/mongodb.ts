import mongoose from 'mongoose';
import { MONGODB_URI } from '../config';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(String(MONGODB_URI));
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};  