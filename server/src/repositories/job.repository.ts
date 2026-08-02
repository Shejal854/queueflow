/**
 * PURPOSE: All Mongo access for the Job collection, including the
 * search/filter/pagination query used by the dashboard.
 *
 * WHY BUILD THE FILTER OBJECT DYNAMICALLY
 * The dashboard lets users combine ANY subset of filters (status only,
 * status+priority, date range only, ...). Building the Mongo filter
 * conditionally (only adding keys that were actually provided) avoids
 * writing 2^n query variants by hand.
 */
import { FilterQuery, Types } from 'mongoose';
import { Job, IJob } from '../models/Job';
import { JobFilterQuery } from '../interfaces';

export const jobRepository = {
  create(data: Partial<IJob>) {
    return Job.create(data);
  },
  findById(id: string) {
    return Job.findById(id);
  },
  findByIdForUser(id: string, userId: string) {
    return Job.findOne({ _id: id, user: userId });
  },
  updateById(id: string, update: Partial<IJob>) {
    return Job.findByIdAndUpdate(id, update, { new: true });
  },
  deleteById(id: string) {
    return Job.findByIdAndDelete(id);
  },

  async findWithFilters(filters: JobFilterQuery) {
    const query: FilterQuery<IJob> = {};

    if (filters.userId) query.user = new Types.ObjectId(filters.userId);
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.type) query.type = filters.type;
    if (filters.search) query.$text = { $search: filters.search };
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) query.createdAt.$gte = new Date(filters.from);
      if (filters.to) query.createdAt.$lte = new Date(filters.to);
    }

    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20;
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      Job.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit),
      Job.countDocuments(query),
    ]);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  },

  countByStatus(status: string) {
    return Job.countDocuments({ status });
  },

  // Used by analytics: average processing time across completed jobs.
  aggregateAvgProcessingTime() {
    return Job.aggregate([
      { $match: { status: 'completed', processingTimeMs: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$processingTimeMs' } } },
    ]);
  },

  aggregateJobsPerDay(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return Job.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  },

  aggregateMostActiveWorker() {
    return Job.aggregate([
      { $match: { workerId: { $exists: true, $ne: null } } },
      { $group: { _id: '$workerId', jobsHandled: { $sum: 1 } } },
      { $sort: { jobsHandled: -1 } },
      { $limit: 1 },
    ]);
  },
};
