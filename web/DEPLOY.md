# Publishing the app (24/7, with the trading game)

This makes the site reachable from anywhere and keeps the game data safe and
always-saving. The app is already coded to support this — you mainly create a
couple of accounts and set some environment variables.

## The big idea
- The **frontend is built once** (`npm run build`) and served by the **FastAPI**
  backend, so the whole thing runs as **one web service**.
- The trading game needs a **persistent database**. Locally that's a SQLite file;
  in production use a **managed Postgres** database (so portfolios/leaderboard
  survive restarts and deploys). The code reads `DATABASE_URL` automatically.

## Step 1 — Put the code on GitHub
1. Create a free **GitHub** account (if you don't have one) and a new repository.
2. Push this project to it. (I can't create accounts for you, but I can help with
   the git commands once you have the repo URL.)

## Step 2 — Create the host + database (Render recommended)
1. Sign up at **render.com** (free to start) and connect your GitHub.
2. Create a **PostgreSQL** instance → copy its **Internal Database URL**.
3. Create a **Web Service** from your repo with:
   - **Build command:**
     ```
     pip install -r web/backend/requirements.txt && cd web/frontend && npm install && npm run build
     ```
   - **Start command:**
     ```
     cd web/backend && uvicorn api:app --host 0.0.0.0 --port $PORT
     ```

## Step 3 — Set environment variables (on the host)
| Variable          | Value                                            | Why |
|-------------------|--------------------------------------------------|-----|
| `DATABASE_URL`    | (the Postgres URL from step 2)                   | Persistent data |
| `SESSION_SECRET`  | a long random string (keep it secret)            | Secures login sessions |
| `SESSION_HTTPS`   | `1`                                              | Secure cookies over https |

Do **NOT** set `ALLOW_DEV_LOGIN` in production (the local-testing backdoor stays off).

## Step 4 — Go live
Render builds and deploys automatically. Every time you push to GitHub, it
redeploys — and because the database is separate, **your game data is never lost**.
You get a URL like `https://smic-club.onrender.com` to share with members.

## Notes
- **Free tier sleeps** after inactivity (first visit takes ~30–60s to wake). A
  small paid tier (~$7/mo) keeps it always-on — worth it if the club relies on it.
- **Backups:** Render's Postgres has backups; keeping the data on a managed DB
  (not the web server's disk) is what makes it durable.
- **Custom domain** (optional): you can point a domain at the Render service later.
