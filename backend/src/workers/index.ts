import { config } from '../config/env.js';
import { runHoldCleaner } from './holdCleaner.worker.js';
import { runEmailRetryWorker } from './emailRetry.worker.js';
import { runMedicationReminderWorker } from './medication.worker.js';

export const startBackgroundWorkers = () => {
  console.log(`⏱️ Initializing background workers (Interval: ${config.worker.intervalSeconds}s)...`);

  const runAllWorkers = async () => {
    try {
      await runHoldCleaner();
      await runEmailRetryWorker();
      await runMedicationReminderWorker();
    } catch (err: any) {
      console.error('[Worker Scheduler Error]:', err?.message);
    }
  };

  // Run immediately on boot
  runAllWorkers();

  // Recurring interval
  const intervalId = setInterval(runAllWorkers, config.worker.intervalSeconds * 1000);

  return () => clearInterval(intervalId);
};
