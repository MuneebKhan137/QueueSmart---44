# Database

Our data lives in a Postgres database on Supabase. Tests never touch it, they use an in-memory copy instead.

## Setup

Copy `.env.example` to `.env` and paste the Supabase session pooler connection string into `DATABASE_URL`.

The first time, one person runs `npm run db:setup`. It creates the tables and adds the demo data. The admin logs in with `Admin1234` and everyone else with `Password1`.

`npm run db:reset -- --yes` wipes the shared database for everyone.

## Tables

The full definitions are in `src/db/schema.sql`.

- Aqeel and Santiago own `user_credentials`, `user_profiles`, `notifications` and `queue_history`.
- Muneeb owns `services` and `queues`.
- Diego owns `queue_entries`.

## Moving your module off store.js

Use `query` from `src/db/db.js`, make your functions async, and await them in your routes. Just make sure you still return camelCase so the frontend doesn't break.

```js
const listServices = async () => {
  const { rows } = await query("SELECT id, name, duration_minutes FROM services");
  return rows.map((row) => ({ id: row.id, name: row.name, durationMinutes: row.duration_minutes }));
};
```

## Tests

Make your tests async and call `await resetTestDb()` in `beforeEach` so every test starts with fresh data. Look at `tests/db.test.js` for examples.