process.env.JWT_ACCESS_SECRET ??= 'e2e-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'e2e-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN ??= '15m';
process.env.JWT_REFRESH_EXPIRES_IN ??= '7d';
process.env.ORIGIN ??= 'http://localhost:5173';
process.env.THROTTLE_TTL ??= '60000';
process.env.THROTTLE_LIMIT ??= '20';
