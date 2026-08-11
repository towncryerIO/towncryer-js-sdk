/**
 * Standard error type thrown by every public SDK method that can fail.
 * Callers can rely on a single `catch` / `.catch()` handling every failure
 * from this SDK, rather than checking for a resolved error-shaped value.
 */
export class TowncryerAPIError extends Error {
  readonly status: number;
  readonly code?: string | number;
  readonly errors?: object;

  constructor(message: string, status = 500, code?: string | number, errors?: object) {
    super(message);
    this.name = 'TowncryerAPIError';
    this.status = status;
    this.code = code;
    this.errors = errors;

    // Restore prototype chain (needed when targeting ES5 or lower)
    Object.setPrototypeOf(this, TowncryerAPIError.prototype);
  }
}
