import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority',
      readPreference: 'primary',
      maxPoolSize: 100,
      minPoolSize: 10,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Enable MongoDB transactions (requires replica set)
    if (process.env.NODE_ENV === 'production') {
      await conn.connection.db.admin().command({ replSetGetStatus: 1 });
    }

  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;