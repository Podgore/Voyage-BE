export const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  INVALID_EMAIL: 'Email must include "@" and a valid domain',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  REQUEST_FAILED: 'Request failed',
  DATABASE_CONNECTION_FAILED: 'Database connection failed',
  USER_NOT_AUTHENTICATED: 'User is not authenticated',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ROOM_ID_MISSING: 'roomId param is missing',
  NOT_ROOM_MEMBER: (userId: string) =>
    `User with current id ${userId} is not a member of this room`,
  NOT_ROOM_OWNER: (userId: string) =>
    `User with current id ${userId} is not the owner of this room`,
  CROSS_ROOM_MEMBERSHIP: (roomMemberId: string, roomId: string) =>
    `Room member ${roomMemberId} does not belong to room ${roomId}`,
  INVALID_ROOM_MEMBER_IDS: 'One or more roomMemberId values are invalid',
  ROOM_NOT_FOUND_BY_INVITE_CODE: 'Room not found for the provided invite code',
  ALREADY_ROOM_MEMBER: 'User is already a member of this room',
  EMAIL_ALREADY_EXISTS: 'A user with this email already exists',
  ROOM_NOT_FOUND: 'Room not found',
  TARGET_NOT_ACTIVE_MEMBER: 'Target user is not an active room member',
  TARGET_ALREADY_OWNER: 'Target user is already the room owner',
  CANNOT_REMOVE_OWNER: 'Owner cannot be removed, transfer ownership first',
  CANNOT_REMOVE_SELF: 'You cannot remove yourself, use leave room instead',
  NOT_ACTIVE_ROOM_MEMBER: 'User is not an active member of this room',
  OWNER_MUST_TRANSFER_OWNERSHIP:
    'Owner must transfer ownership before leaving the room',
} as const;
