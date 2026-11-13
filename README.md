# 🚗 Vehicle Availability System

Full-stack app: **Express (Node.js)** REST API + **React (Vite)** UI. Search vehicles by date range, see live availability, book/cancel, and manage the fleet. Data is stored in a JSON file (`server/data/db.json`, auto-created and seeded) — no database setup required.

## Run in VS Code
1. Open the folder in VS Code (Node 18.11+ required).
2. Terminal → `npm run install:all`
3. Terminal → `npm run dev` (or **Terminal → Run Build Task**)
4. Open http://localhost:5173 (API runs on :3001)

## Test
- **Automated:** `npm test` (Jest + Supertest) — or run the *Debug API tests (Jest)* launch config.
- **Manual API:** open `server/requests.http` and click *Send Request* (needs the REST Client extension).
- **Debug API:** Run & Debug → *Debug API (Node)*.

## API
| Method | Path | Notes |
|---|---|---|
| GET | `/api/vehicles?start&end&type&available=true&q` | each vehicle includes `available` for the range |
| POST/PUT/DELETE | `/api/vehicles[/:id]` | validates, unique plate |
| GET/POST | `/api/bookings` | POST returns 409 on overlap or maintenance |
| DELETE | `/api/bookings/:id` | cancel |

## Deploy
**Push to GitHub**
```bash
git init && git add . && git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/vehicle-availability-system.git
git push -u origin main
```
CI (`.github/workflows/ci.yml`) runs tests and builds the client on every push.

**Host it** (single service serves API + built React app):
- **Render / Railway:** build command `npm run install:all && npm run build`, start command `npm start`.
- **Docker:** `docker build -t vas . && docker run -p 3001:3001 vas` → http://localhost:3001

> Note: free hosts often have ephemeral disks, so the JSON file resets on redeploy. For production persistence, swap `server/src/store.js` for MongoDB/Postgres.
