export const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  INVALID_EMAIL: 'Email must include "@" and a valid domain',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  REQUEST_FAILED: 'Request failed',
  DATABASE_CONNECTION_FAILED: 'Database connection failed',
  USER_NOT_AUTHENTICATED: 'User is not authenticated',
  ROOM_ID_MISSING: 'roomId param is missing',
  NOT_ROOM_MEMBER: 'You are not a member of this room',
  NOT_ROOM_OWNER: 'You must be the room owner',
} as const;
