import express from 'express';
import withdrawalRoutes from './modules/withdrawal/withdrawal.routes.js';
import userRoutes from "./modules/user/user.routes.js";
import walletRoutes from "./modules/wallet/wallet.routes.js";
import transactionRoutes from "./modules/transaction-log/transaction.routes.js";
import errorMiddleware from './middlewares/error.middleware.js';
import securityMiddleware from './middlewares/security.middleware.js';
import path from "path";
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import connectDB from './config/database.js';
import logger from './utils/logger.js';
import { connectRedis, getRedisClient } from './config/redis.js';
import withdrawalQueue from "./jobs/withdrawal.processor.js";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { helmet, requestId, auditLog, validateContentType, sanitize } = securityMiddleware;

// Initialize services
async function initializeServices() {
    try {
        // Connect to MongoDB
        await connectDB();
        logger.info('MongoDB connected successfully');

        // Connect to Redis
        await connectRedis();
        logger.info('Redis connected successfully');

    } catch (error) {
        logger.error('Failed to initialize services:', error);
        process.exit(1);
    }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Middleware
app.use(helmet);
app.use(requestId);
app.use(auditLog);
app.use(validateContentType);
app.use(sanitize);


app.use('/api/withdrawals', withdrawalRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/transactions", transactionRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            database: 'connected',
            redis: 'connected',
            queue: 'initialized'
        }
    });
});


app.use(errorMiddleware);

// Graceful shutdown
async function gracefulShutdown(signal) {
   logger.info(`${signal} received. Starting graceful shutdown...`);

    try {
        // Stop accepting new requests
        server.close(async () => {
            logger.info('HTTP server closed');

            // Close queue connections
            await withdrawalQueue.close();
            logger.info('Queue connections closed');

            // Close database connections
            // await mongoose.connection.close();
            // logger.info('MongoDB connection closed');

            // Close Redis connection
            const redisClient = getRedisClient();
            if (redisClient) {
                await redisClient.quit();
                logger.info('Redis connection closed');
            }

            logger.info('Graceful shutdown completed');
            process.exit(0);
        });

        // Force close after timeout
        setTimeout(() => {
            logger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);

    } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
}

// Start server
async function startServer() {
    await initializeServices();

    const server = app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error);
        gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (error) => {
        logger.error('Unhandled Rejection:', error);
        gracefulShutdown('UNHANDLED_REJECTION');
    });

    return server;
}

startServer();

export default app;