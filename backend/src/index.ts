import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import assessmentRoutes from './routes/assessment';
import careerMatchingRoutes from './routes/careerMatching';
import skillGapRoutes from './routes/skillGap';
import careerGuideRoutes from './routes/careerGuide';
import careerContentRoutes from './routes/careerContent';
import savedCareerRoutes from './routes/savedCareer';
import assistantRoutes from './routes/assistant';
import { errorHandler, NotFoundError } from './middleware/errorHandler';

const app = express();

// Standard middleware
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/careers', careerMatchingRoutes);
app.use('/api/careers', skillGapRoutes);
app.use('/api/agent', careerGuideRoutes);
app.use('/api/careers', careerContentRoutes);
app.use('/api/careers', savedCareerRoutes);
app.use('/api/assistant', assistantRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ai-career-guide-backend',
    environment: config.NODE_ENV,
  });
});

// 404 catch-all route handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Centralized error handling middleware
app.use(errorHandler);

const startServer = () =>
  app.listen(config.PORT, () => {
    console.log(`
=============================================
  AI Career Guide - Backend API
=============================================
  📡 Environment : ${config.NODE_ENV}
  🔌 Port        : ${config.PORT}
  🌐 Health Check: http://localhost:${config.PORT}/api/health
  🚀 Status      : Online & Ready
=============================================
  `);
  });

if (require.main === module) {
  startServer();
}

export { app, startServer };
