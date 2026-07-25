# Voyage-BE

Backend service built with [NestJS](https://nestjs.com/).

## Requirements

- Node.js 20+
- npm

## Installation

```bash
npm install
```

## Running locally

```bash
# development mode with hot-reload
npm run start:dev

# production mode
npm run start:prod
```

The server runs on `http://localhost:3000` by default.



## Health check

Returns `{ "status": "ok" }` if the service is running.

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e
```


## Database migrations (Prisma)

Requires `DATABASE_URL` set in `.env` (see `.env.example` for the format).

### Generate & apply a new migration
```bash
npx prisma migrate dev --name <migration_name>
```
Creates a new migration file based on schema changes and applies it to the database.

### Apply pending migrations (production/CI)
```bash
npx prisma migrate deploy
```

### Revert / reset database
Prisma does not support automatic single-step rollback. To revert:
```bash
npx prisma migrate reset
```
This drops the database, reapplies all migrations from scratch, and re-seeds if a seed script exists.

### Regenerate Prisma Client
```bash
npx prisma generate
```
Run this after any change to `prisma/schema.prisma`.