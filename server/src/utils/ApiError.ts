/**
 * PURPOSE: A typed error that carries an HTTP status code, so the
 * central error middleware knows how to respond without guessing.
 */
export class ApiError extends Error {
  statusCode: number;
  errors?: unknown;

  constructor(statusCode: number, message: string, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
