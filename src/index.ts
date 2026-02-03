import http from 'http';

import { PORT } from './config';
import app from './app';
import { initSocket } from './socket';



// seedCategories().catch((error) => {
//   console.error("Failed to seed categories:", error);
//   process.exit(1);
// });

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
