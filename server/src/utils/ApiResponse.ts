/**
 * PURPOSE: Helper to build the standard success envelope every endpoint
 * returns: { success, message, data }. Keeps response SHAPE consistent
 * without every controller hand-rolling the object literal.
 */
import { Response } from 'express';

export function sendSuccess<T>(res: Response, statusCode: number, message: string, data: T) {
  return res.status(statusCode).json({ success: true, message, data });
}
