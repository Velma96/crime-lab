# Beacon — Community Crime Reporting Platform

A citizen crime-reporting site: citizens sign up, file reports with geolocation,
photo/video evidence, and a description, then get notified the moment an officer
responds. Admins get an instant live notification the moment a report comes in,
can request more information, and update status through four stages: Received →
Under Review → Officer Assigned → Resolved. The public front page carries
first-aid and safety bulletins.

```
beacon/
├── backend/     Node.js + Express API, PostgreSQL (via Prisma), Socket.io
└── frontend/    React + Vite site (citizen portal, admin portal, public pages)
```

---

## 1. Prerequisites

Install these once, if you don't have them:

- **Node.js** 18 or newer — https://nodejs.org
- **PostgreSQL** — either installed locally (https://www.postgresql.org/download/)
  or a free hosted database (Neon, Supabase, or Railway all offer one — see step 2b).
- **Git** — https://git-scm.com

Check versions:
```bash
node -v
npm -v
git --version
```

## 2. Set up the database

**Option A — local Postgres:**
```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16
createdb beacon

# Ubuntu/Debian
sudo apt install postgresql
sudo -u postgres createdb beacon
```

**Option B — free hosted Postgres (no local install, easier if you're new to this):**
1. Create a free database at https://neon.tech or https://supabase.com
2. Copy the connection string they give you (looks like `postgresql://user:pass@host/db`)

## 3. Run the backend

```bash
cd backend
cp .env.example .env
```
Open `.env` and set:
- `DATABASE_URL` — your Postgres connection string from step 2
- `JWT_SECRET` — any long random string (run `openssl rand -hex 32` to generate one)

Then:
```bash
npm install
npx prisma migrate dev --name init   # creates the database tables
npm run seed                          # creates the admin account + starter bulletins
npm run dev                           # starts the API on http://localhost:4000
```

You should see `Beacon API listening on http://localhost:4000`. Leave this running.

## 4. Run the frontend

Open a **new terminal window** (keep the backend running):
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Visit **http://localhost:5173** — the site is live locally.

- Citizen signup: click "Report Now" on the home page
- Admin login: click "Admin / Officer portal" at the bottom of the home page
  - username: `admin`
  - password: `admin123`
  - **Change this password** before using the site for anything real (there's no
    "change password" screen yet — easiest way for now is `npx prisma studio`
    in the backend folder, open the `User` table, and replace the `password`
    field with a new bcrypt hash).

## 5. Push it to GitHub

From the `beacon` folder (the one containing this README):
```bash
git init
git add .
git commit -m "Initial commit: Beacon crime reporting platform"
```

Create a new empty repository on GitHub (github.com → New repository → don't
initialize with a README, since you already have one), then:
```bash
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

Your `.env` files are excluded by `.gitignore` — they never get pushed, so your
database password and JWT secret stay private.

## 6. Deploying it live (making it a real public website)

Once it's on GitHub, two free-tier-friendly options:

- **Backend** → [Render](https://render.com) or [Railway](https://railway.app):
  connect your GitHub repo, point it at the `backend` folder, set the same
  environment variables from your `.env` in their dashboard, and it builds
  automatically on every push.
- **Frontend** → [Vercel](https://vercel.com) or [Netlify](https://netlify.com):
  connect the repo, point it at the `frontend` folder, set `VITE_API_URL` to
  your deployed backend's URL, and it deploys automatically too.

Both platforms have a generous free tier and detailed "connect a GitHub repo"
wizards — no server management needed.

## What's real vs. what to add before production

This is a fully working full-stack app, not a mockup — but a few things are
worth doing before real citizens rely on it:
- **HTTPS** everywhere (automatic on Render/Vercel/Railway).
- **Rate limiting** on signup/login to slow down brute-force attempts.
- **Moving uploads to cloud storage** (e.g. AWS S3 or Cloudflare R2) instead of
  the server's local disk, so evidence survives redeploys.
- **A password reset flow** and an admin "change password" screen.
- **A privacy/data-retention policy**, since you're storing photos, video, and
  locations tied to real people.
