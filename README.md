# Voyage-BE

Backend service built with [NestJS](https://nestjs.com/).

## Requirements

- Node.js 20+
- npm
- Docker Desktop (if you want to run everything in containers)

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

## Local Database

This project uses PostgreSQL through Docker Compose. pgAdmin is also included so you can look at the database visually (optional, but convenient).

### Requirements

- Docker Desktop installed and running
- On Windows you might need to enable virtualization in BIOS first

### How to run

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Start the containers:

```bash
docker-compose up -d
```

3. Check that everything is running:

```bash
docker ps
```

You should see three containers with status Up: voyage-backend, voyage-postgres and voyage-pgadmin

### Connection details

Postgres: localhost:5432

- database: voyage_db
- user: voyage_user
- password: voyage_pass

pgAdmin: http://localhost:5050

- login: admin@voyage.com
- password: admin

If you want to connect to the database inside pgAdmin, register a new server and in the Host field use `postgres`, not `localhost` (that's the service name from docker-compose).

### How to stop

```bash
docker-compose down
```

This does not delete your data. If you also want to wipe the data:

```bash
docker-compose down -v
```

## Running everything with Docker (backend + database)

If you don't want to install Node.js locally, you can run everything through Docker:

```bash
docker-compose up -d --build
```

This starts the backend, PostgreSQL, and pgAdmin together. The backend will be available at `http://localhost:3000`.

To rebuild the backend image after changing dependencies:

```bash
docker-compose up -d --build backend
```
