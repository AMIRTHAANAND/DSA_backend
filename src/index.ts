import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
<<<<<<< HEAD
import { connectDB, disconnectDB } from './config/database';
=======
import { connectDB } from './config/database';
>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import topicRoutes from './routes/topics';
import assignmentRoutes from './routes/assignments';
import quizRoutes from './routes/quizzes';
import progressRoutes from './routes/progress';
import adminRoutes from './routes/admin';
import adminAuthRoutes from './routes/adminAuth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);                 // User auth routes
app.use('/api/users', userRoutes);               // User management routes
app.use('/api/topics', topicRoutes);             // Topics
app.use('/api/assignments', assignmentRoutes);   // Assignments
app.use('/api/quizzes', quizRoutes);             // Quizzes
app.use('/api/progress', progressRoutes);        // Progress tracking

// Admin routes
app.use('/api/admin/auth', adminAuthRoutes);     // Admin registration/login/approval
app.use('/api/admin', adminRoutes);              // Admin dashboard, analytics, etc.

// Health check endpoint
app.get('/api/health', (req, res) => {
<<<<<<< HEAD
  res.status(200).json({
    status: 'OK',
=======
  res.status(200).json({ 
    status: 'OK', 
>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
    message: 'DSA Learning Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
<<<<<<< HEAD
const server = app.listen(PORT, () => {
=======
app.listen(PORT, () => {
>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 DSA Learning Platform API`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

<<<<<<< HEAD
// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

export default app;
=======
export default app;
>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
