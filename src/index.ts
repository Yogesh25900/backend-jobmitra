import express, { Application } from 'express';
import bodyParser from 'body-parser';
import { PORT } from './config';
import { connectDB } from './database/mongodb';

const app: Application = express();

connectDB();
app.use(bodyParser.json());

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

});

export default app;
