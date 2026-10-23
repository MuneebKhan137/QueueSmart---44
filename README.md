# QueueSmart-42

QueueSmart is a smart queue management web app (Group 42). Users join and track queues for services; administrators manage services and serve the next person in line.

## Tech stack

- **Frontend:** React 18, Vite, React Router
- **Backend:** Node.js, Express 5 (REST API, data kept in memory)
- **Tests:** Jest and Supertest

## Requirements

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) 18 or newer (npm is included)

## Getting started

Clone the repo, then start the backend and the frontend in two separate terminals.

```bash
git clone https://github.com/marujpree/QueueSmart-42.git
cd QueueSmart-42
```

**Backend** (http://localhost:3001/api)

```bash
cd backend
npm ci
npm start
```

**Frontend** (http://localhost:5173)

```bash
cd frontend
npm ci
npm run dev
```

`npm ci` installs the exact versions in `package-lock.json` and never changes it. Use `npm install <package>` only when you are adding a dependency, and commit `package.json` and `package-lock.json` together when you do.

The frontend must run on port 5173, because the backend only allows requests from that origin. If the port is already taken, `npm run dev` stops with an error instead of picking another port.

## Backend

### Scripts

Run these from `backend/`.

| Command | What it does |
| --- | --- |
| `npm start` | Start the API on port 3001 (set `PORT` to change it) |
| `npm run dev` | Start the API and restart on file changes |
| `npm test` | Run the Jest unit tests |
| `npm run test:coverage` | Run the tests and print a coverage report |

### Folder layout

```
backend/
  src/
    app.js              Express app: CORS, JSON parsing, routes, error handling
    server.js           Starts the server
    routes/             Mounts each module under /api
    modules/auth/       Registration and login (validation, service, routes)
    middleware/         currentUser, requireUser, requireAdmin
    data/store.js       In-memory data and seed data
    utils/              Shared helpers (HttpError)
  tests/                Jest tests
```

#

## Troubleshooting

### Port 5173 is already in use

If an old dev server is still running, `npm run dev` stops with:

```
error when starting dev server:
Error: Port 5173 is already in use
```

Stop the old server, then start it again.

Linux / macOS:

```bash
pkill -f vite
```

or free just that port:

```bash
kill $(lsof -t -i :5173)
```

Windows (PowerShell):

```powershell
netstat -ano | findstr :5173
taskkill /PID <pid from the last column> /F
```

### Login or register says "Failed to fetch"

The backend is not running. Start it with `npm start` in `backend/`.
