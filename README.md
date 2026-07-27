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