# QueueFlow — Distributed Job Queue System

QueueFlow is a full-stack demo project built to showcase backend engineering and distributed-systems fundamentals with a clean, production-like architecture.

It includes:
- `server/` — Express + TypeScript API service
- `worker/` — independent BullMQ consumer process
- `client/` — React + TypeScript dashboard
- `docker/` — Docker Compose orchestration for MongoDB, Redis, API, worker, and frontend

This project is designed as a polished resume/interview repo for an SDE-1 / SDE internship audience.

---

## Why this project is worth sharing

- Demonstrates a real producer-consumer job queue system
- Shows clean layered architecture and separation of concerns
- Includes auth, realtime updates, retry/backoff, and dead-letter queue handling
- Uses common industry technologies without over-engineering
- Ships with Docker Compose for easy local setup

---

## Features

- User authentication with JWT access + refresh tokens
- Job creation, queuing, progress, and audit logging
- Worker processing with priority, delay, retry, and DLQ semantics
- Realtime dashboard updates via Socket.IO and Redis Pub/Sub
- Clean API design, validation with Zod, and structured logging with Pino
- Independent API and worker services sharing MongoDB + Redis

---

## Architecture

The app is intentionally built as a modular monolith:
- Browser SPA → API server
- API server stores state in MongoDB and enqueues jobs in Redis/BullMQ
- Worker process consumes jobs from Redis and updates MongoDB
- Realtime events flow through Redis Pub/Sub and Socket.IO

This keeps the system simple while still demonstrating distributed behavior and horizontal worker scalability.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| State | TanStack Query |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Queue | Redis, BullMQ |
| Realtime | Socket.IO, Redis Pub/Sub |
| Auth | JWT access + refresh tokens |
| Validation | Zod |
| Logging | Pino |
| Deployment | Docker + Docker Compose |

---

## Repository Structure

```text
queueflow/
├── client/      # React dashboard
├── docker/      # Compose file for local development
├── server/      # API service
├── shared/      # notes for shared package style
└── worker/      # BullMQ worker process
```

---

## Run locally

### Prerequisites

- Node.js 20+
- MongoDB running locally
- Redis running locally
- Docker Desktop if using Docker Compose

### Install dependencies

```bash
cd server && npm install
cd ../worker && npm install
cd ../client && npm install
```

### Configure environment

```bash
cp server/.env.example server/.env
cp worker/.env.example worker/.env
cp client/.env.example client/.env
```

Update `server/.env` with strong random JWT secrets.

### Run manually

Use separate terminals for each service:

```bash
cd server && npm run dev
cd worker && npm run dev
cd client && npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000

### Run with Docker Compose

```bash
cd docker
docker compose up --build
```

This starts MongoDB, Redis, the API, the worker, and the client together.

To scale workers horizontally:

```bash
docker compose up --build --scale worker=3
```

---

## Testing

```bash
cd server && npm test
```

The current test suite includes auth integration tests in `server/tests/auth.test.ts`.

---

## Environment Variables

See the example files in each service directory:
- `server/.env.example`
- `worker/.env.example`
- `client/.env.example`

Important settings:
- `MONGO_URI` — MongoDB connection string
- `REDIS_HOST`, `REDIS_PORT` — Redis connection for BullMQ and pub/sub
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — strong secret keys for auth
- `WORKER_CONCURRENCY` — number of concurrent jobs per worker
- `VITE_API_URL` — frontend API base URL

---

## What makes QueueFlow strong for GitHub

- Clear high-level explanation of architecture and intent
- Easy local setup with both manual and Docker workflows
- Full-stack coverage across API, worker, and client
- Production-like features such as auth, realtime, retries, and audit logging
- Good separation between business logic, persistence, and request handling

---

## Recommended next steps before pushing

- Add a `LICENSE` file if you want to open source the repo
- Add a short screenshot or animated GIF of the dashboard
- Add a `CONTRIBUTING.md` or `docs/` note if you want to document development or interview prep
- Commit the README and then push with GitHub
