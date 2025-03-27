import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import sessionsRoutes from './routes/sessions';
import callersRoutes from './routes/callers';
import locationsRoutes from './routes/locations';
import respondersRoutes from './routes/responders';
import dispatchesRoutes from './routes/dispatches';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the API' });
});

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/callers', callersRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/responders', respondersRoutes);
app.use('/api/dispatches', dispatchesRoutes);

// Error handling middleware
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('Connected to database');
        
        app.listen(config.port, () => {
            console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer(); 