import { connectDB } from './database/mongodb';
import employerRoute from './routes/employerUser.route';
import talentUserRoutes from './routes/talentUser.route';
import jobRoutes from './routes/job.route';
import savedJobRoutes from './routes/savedJob.route';
import adminRoutes from './routes/admin.route';
import jobApplicationRoutes from './routes/jobApplication.route';
import recommendRoutes from './routes/recommend.route';
import extractedCandidateRoutes from './routes/extractedCandidate.route';
import notificationRoutes from './routes/notification.route';
import categoryRoutes from './routes/categoryRoutes';
import bodyParser from 'body-parser';
import cors from 'cors';
import { seedAdminUser } from './seeds/admin.seed';
import { initSocket } from './socket';
import { seedCategories } from './seeds/category.seed';
import path from 'path';
import express, { Application } from 'express';
import { de } from 'zod/v4/locales';

const app: Application = express();

connectDB();
app.use(
  cors({
    origin: "http://localhost:3000", // EXACT frontend origin
    credentials: true,               // allow cookies
  })
);

// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// API Routes - MUST come before static middleware
app.use('/api/talentusers', talentUserRoutes);
app.use('/api/employerusers', employerRoute);
app.use('/api/jobs', jobRoutes);
app.use('/api/saved-jobs', savedJobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/applications', jobApplicationRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/extracted-candidates', extractedCandidateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);

// Static file serving - AFTER all API routes
app.use('/', express.static(path.join(__dirname, '..', 'public')));

// seedAdminUser().catch((error) => {
//   console.error("Failed to seed admin user:", error);
//   process.exit(1);
// });

export default app;