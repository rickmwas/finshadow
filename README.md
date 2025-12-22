# FinShadow

FinShadow is a full-stack TypeScript application for security and intelligence dashboards — features include dashboards, dark web intel, threat actor tracking, fraud findings, and prediction views. The project uses a Vite + React client and an Express + TypeScript server with Drizzle ORM for database interactions.

## Key Features

- Real-time UI powered by Vite + React
- Structured UI components (Radix + Tailwind + custom components)
- Server API implemented in TypeScript (Express)
- Database tooling with Drizzle ORM
- Pages: Dashboard, Dark Web Intel, Threat Actors, Fraud Findings, Predictions

## Tech Stack

- Frontend: React, Vite, TypeScript
- Styling: Tailwind CSS
- UI primitives: Radix UI, custom component library
- Server: Node + Express + TypeScript
- Database: PostgreSQL (via `pg`) and Drizzle ORM
- Misc: Drizzle Kit, tsx for running TypeScript directly

## Repo Layout (important files)

- `client/` — Vite + React application source
- `server/` — Express server entrypoint and routes
- `script/` — build scripts
- `shared/` — shared types and schema (e.g., `shared/schema.ts`)
- `drizzle.config.ts` — Drizzle configuration

## Getting Started

1. Install node dependencies

```powershell
cd <project_root_folder>
npm install
```

2. Run the server and client (development)

Open two terminals and run:

- Start the server (runs TypeScript server via `tsx`):

```powershell
npm run dev
```

- Start the client (Vite dev server on port 5000):

```powershell
npm run dev:client
```

Note: `npm run dev` in this repo runs the server process (`server/index.ts`). The client dev server is started separately with `npm run dev:client`.

3. Build for production

```powershell
npm run build
```

4. Run production build

```powershell
npm run start
```

5. Database

- Push Drizzle migrations/schema to your database:

```powershell
npm run db:push
```

Make sure you have your Postgres connection configured (typically via environment variables). If the project expects a `.env` file, create one in the repo root — it may include variables such as `DATABASE_URL`, `PORT`, and any auth-related secrets.

## Useful Scripts

- `npm run dev` — Run the server in development (`cross-env NODE_ENV=development tsx server/index.ts`)
- `npm run dev:client` — Start Vite dev server on port 5000
- `npm run build` — Build the project using `tsx script/build.ts`
- `npm run start` — Start the production server (`cross-env NODE_ENV=production node dist/index.cjs`)
- `npm run check` — Type-check with `tsc`
- `npm run db:push` — Run `drizzle-kit push` to apply Drizzle schema changes

## Development Tips

- Run server and client in separate terminals for fastest feedback loop.
- If you experience issues starting `npm run dev`, ensure `tsx` and `cross-env` are installed and that `node` version is compatible with the devDependencies.
- Use `npm run check` to catch TypeScript issues early.

## Docker (local development)

These instructions let you run Postgres + the app via Docker Compose. Docker Desktop must be installed and running.

1. Copy `.env.example` to `.env` and update if needed (only `DATABASE_URL`/`JWT_SECRET` if you want custom values):

```powershell
cp .env.example .env
```

2. Build and start the stack (Postgres + app):

```powershell
docker compose up -d --build
```

3. Tail logs (optional):

```powershell
docker compose logs -f
```

4. Apply Drizzle schema (if compose didn't run it automatically):

```powershell
# Runs on the host; requires DATABASE_URL in .env to point to the compose 'db' service
npm run db:push
```

5. Verify API health:

```powershell
curl http://localhost:5000/api/health
```

6. Stop the stack:

```powershell
docker compose down
```

Troubleshooting:
- If Docker Desktop reports the daemon not starting, restart Docker Desktop and try again.
- Ensure ports `5000` and `5432` are free on your system.
- If you prefer not to run Docker, you can set up Postgres locally and set `DATABASE_URL` accordingly.

## Contributing

- Fork and open a PR with clear description and testing steps.
- Keep UI components reusable and documented in `client/src/components`.

## License

This project is licensed under the MIT License.

---

