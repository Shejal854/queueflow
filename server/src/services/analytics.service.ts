/**
 * PURPOSE: Aggregation queries powering the dashboard's stat cards and
 * charts (jobs per day, success rate, average processing time, most
 * active worker).
 *
 * WHY MONGO AGGREGATION PIPELINE INSTEAD OF FETCHING ALL JOBS AND
 * COMPUTING IN NODE
 * Aggregation runs inside the database, close to the data, and can use
 * indexes -- pulling thousands of job documents into Node just to
 * count/average them in JS does not scale and wastes network+memory.
 * "Push computation to the data" is a standard system-design principle.
 */
import { jobRepository } from '../repositories/job.repository';
import { JOB_STATUS } from '../constants';

export const analyticsService = {
  async getDashboardStats() {
    const [pending, queued, running, completed, failed, deadLetter, avgAgg] = await Promise.all([
      jobRepository.countByStatus(JOB_STATUS.PENDING),
      jobRepository.countByStatus(JOB_STATUS.QUEUED),
      jobRepository.countByStatus(JOB_STATUS.RUNNING),
      jobRepository.countByStatus(JOB_STATUS.COMPLETED),
      jobRepository.countByStatus(JOB_STATUS.FAILED),
      jobRepository.countByStatus(JOB_STATUS.DEAD_LETTER),
      jobRepository.aggregateAvgProcessingTime(),
    ]);

    const totalJobs = pending + queued + running + completed + failed + deadLetter;
    const finished = completed + failed + deadLetter;
    const successRate = finished > 0 ? Math.round((completed / finished) * 10000) / 100 : 0;

    return {
      pending,
      queued,
      running,
      completed,
      failed,
      deadLetter,
      totalJobs,
      successRate, // percentage
      avgProcessingTimeMs: avgAgg[0]?.avg ?? 0,
    };
  },

  async getJobsPerDay(days = 14) {
    return jobRepository.aggregateJobsPerDay(days);
  },

  async getMostActiveWorker() {
    const result = await jobRepository.aggregateMostActiveWorker();
    return result[0] ?? null;
  },
};
