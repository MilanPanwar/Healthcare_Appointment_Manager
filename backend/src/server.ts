import app from './app.js';
import { config } from './config/env.js';
import { startBackgroundWorkers } from './workers/index.js';

const server = app.listen(config.port, () => {
  console.log('==================================================');
  console.log(`🏥 HealthFlow Backend API running on port ${config.port}`);
  console.log(`🌐 Environment: ${config.nodeEnv}`);
  console.log(`🔗 API Base: http://localhost:${config.port}/api`);
  console.log('==================================================');

  // Start background workers (Slot Hold Cleaner, Email Retry, Medication Reminders)
  startBackgroundWorkers();
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server gracefully.');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Closing HTTP server gracefully.');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
