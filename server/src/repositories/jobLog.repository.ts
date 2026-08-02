import { JobLog } from '../models/JobLog';
import { JobLogEvent } from '../constants';

export const jobLogRepository = {
  create(jobId: string, event: JobLogEvent, message?: string, meta?: Record<string, unknown>) {
    return JobLog.create({ job: jobId, event, message, meta });
  },
  findByJob(jobId: string) {
    return JobLog.find({ job: jobId }).sort({ createdAt: 1 });
  },
};
