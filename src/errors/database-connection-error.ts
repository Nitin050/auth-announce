import { CustomError } from './custom-error';

export class DatabaseConnectionError extends CustomError {
  statusCode= 500;
  reason = 'database connection error';

  constructor() {
    super('database connection error');

    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }

  serializeErrors() {
    return [{ message: this.reason }];
  }
}
