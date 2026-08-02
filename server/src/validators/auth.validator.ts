/**
 * PURPOSE: Runtime validation of request bodies for auth routes using Zod.
 *
 * WHY VALIDATE AT ALL (TypeScript isn't enough)
 * TypeScript types are erased at compile time -- they give ZERO runtime
 * safety against a malicious or buggy client sending `{ email: 123 }`
 * or omitting a field entirely. Zod schemas run at request time and are
 * the actual boundary that protects the database from garbage input.
 *
 * WHY ZOD OVER manual `if (!x) throw` CHECKS
 * Declarative, composable, generates readable error messages, and the
 * schema doubles as documentation of the exact shape of valid input.
 */
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(72),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
