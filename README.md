# LiftLedger

## What It Is

LiftLedger is a full-stack web app that lets me record and review my workout sets, including the exercise, weight, reps, date, and an optional note.

## The Problem It Solves

I kept forgetting the weight I used in my last gym session and would waste time guessing where to restart. LiftLedger keeps a persistent history of each set so I can begin the next session from an accurate record instead of relying on memory.

## What I Intentionally Excluded

- **User authentication:** this is a personal MVP, so adding sessions or JWT-based access control would increase the security and deployment surface without solving the immediate memory problem.
- **Workout plans and progress charts:** the first version focuses on reliable CRUD and a fast logging flow; analytics can be added after the data-entry workflow is proven useful.

## Data Model and CRUD Meaning

The main entity is a `workout_set` with the fields `exercise`, `weight`, `reps`, `loggedAt`, and `notes`. Create adds a set after a training session, Read displays the newest sets first, Update corrects a weight or other field when I made a logging mistake, and Delete removes a duplicate or accidental entry.

## Tech Stack

- **Backend:** Node.js, Express, better-sqlite3, and CORS
- **Frontend:** semantic HTML, CSS, and vanilla JavaScript
- **Database:** SQLite
- **Deployment:** Render for the backend and GitHub Pages for the frontend

## Live Deployment

**Frontend:** [Add the deployed frontend URL after publishing]

**Backend:** [Add the deployed backend URL after publishing]

## API Routes

| Operation | Method | Route | Purpose |
| --- | --- | --- | --- |
| Health | GET | `/health` | Confirms that the backend is running. |
| Create | POST | `/sets` | Inserts a validated workout set into SQLite. |
| Read | GET | `/sets` | Returns all workout sets, newest first. |
| Update | PUT | `/sets/:id` | Replaces the editable fields for one existing set. |
| Delete | DELETE | `/sets/:id` | Permanently removes one workout set. |

The `.env` file is excluded through `.gitignore`; only `.env.example` is committed.

## Run Locally

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Then open `frontend/index.html` in a browser. The local frontend uses `http://localhost:3000` by default. For a deployed frontend, set `window.BACKEND_URL` before loading `app.js`, or replace the fallback value in `frontend/app.js` with the deployed API URL.

## Assignment Demonstration

The demonstration video shows the deployed frontend performing Create, Read, Update, and Delete, followed by an explanation of the update route and the personal problem this app solves.
