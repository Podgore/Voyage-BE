export const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  INVALID_EMAIL: 'Email must include "@" and a valid domain',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  REQUEST_FAILED: 'Request failed',
  DATABASE_CONNECTION_FAILED: 'Database connection failed',
} as const;

export const VALIDATION_CONSTRAINT_MESSAGES: Record<string, string> = {
  'email must be an email': ERROR_MESSAGES.INVALID_EMAIL,
};
