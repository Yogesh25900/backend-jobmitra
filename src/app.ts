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
import categoryRoutes from './routes/category.routes';
import feedbackRoutes from './routes/feedback.route';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import express, { Application } from 'express';
import { JobService } from './services/job.service';
import { initMeilisearch } from './config/meilisearch.client';

const app: Application = express();
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

if (!isTestEnv) {
  connectDB();
}
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,              
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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
app.use('/api/feedback', feedbackRoutes);
app.use('/', express.static(path.join(__dirname, '..', 'public')));

// seedAdminUser().catch((error) => {
//   console.error("Failed to seed admin user:", error);
//   process.exit(1);
// });


const os = require('os');

app.get('/health', (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  
  let ipAddress = '';

  for (const interfaceName in networkInterfaces) {
    for (const net of networkInterfaces[interfaceName]) {
      if (net.family === 'IPv4' && !net.internal) {
        ipAddress = net.address;
      }
    }
  }

  res.json({
    status: 'OK',
    ip: ipAddress
  });
});


async function main() {
  try {
    const jobService = new JobService();
    console.log('[Server] Initializing Meilisearch...');
    await initMeilisearch();
    
    console.log('[Server] Indexing jobs in Meilisearch...');
    await jobService.indexJobsInMeili();
    console.log('[Server] Initial job indexing complete!');
  } catch (error: any) {
    console.error("[Server] Error during job indexing:", error.message);
    console.warn("[Server] Search may not be fully functional. Ensure Meilisearch is running.");
  }
}

if (!isTestEnv) {
  void main();
}

export default app;