import { z } from 'zod';
import { JOB_PRIORITY } from '../constants';

export const createJobSchema = z.object({
  body: z.object({
    type: z.string().min(1).max(100),
    payload: z.record(z.unknown()).default({}),
    priority: z.nativeEnum(JOB_PRIORITY).default(JOB_PRIORITY.MEDIUM),
    delayMs: z.number().int().min(0).max(1000 * 60 * 60 * 24).optional(),
    maxAttempts: z.number().int().min(1).max(10).optional(),
  }),
});

export const updateJobSchema = z.object({
  body: z.object({
    payload: z.record(z.unknown()).optional(),
    priority: z.nativeEnum(JOB_PRIORITY).optional(),
  }),
});

export const jobIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
