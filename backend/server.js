require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const databasePath = process.env.DATABASE_PATH || path.join(__dirname, 'liftledger.db');
const db = new Database(databasePath);

db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS workout_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise TEXT NOT NULL,
    weight REAL NOT NULL CHECK(weight >= 0),
    reps INTEGER NOT NULL CHECK(reps > 0),
    logged_at TEXT NOT NULL,
    notes TEXT DEFAULT ''
  )
`);

app.use(cors());
app.use(express.json());

function validateSet(payload) {
  const exercise = typeof payload.exercise === 'string' ? payload.exercise.trim() : '';
  const weight = Number(payload.weight);
  const reps = Number(payload.reps);
  const notes = typeof payload.notes === 'string' ? payload.notes.trim() : '';
  const loggedAt = typeof payload.loggedAt === 'string' && payload.loggedAt
    ? payload.loggedAt
    : new Date().toISOString().slice(0, 10);

  if (!exercise) return { error: 'Exercise name is required.' };
  if (!Number.isFinite(weight) || weight < 0) return { error: 'Weight must be a non-negative number.' };
  if (!Number.isInteger(reps) || reps < 1) return { error: 'Reps must be a positive whole number.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(loggedAt)) return { error: 'Date must use YYYY-MM-DD format.' };

  return { value: { exercise, weight, reps, loggedAt, notes } };
}

function toClientShape(row) {
  return {
    id: row.id,
    exercise: row.exercise,
    weight: row.weight,
    reps: row.reps,
    loggedAt: row.logged_at,
    notes: row.notes || ''
  };
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// CREATE — log a new workout set.
app.post('/sets', (req, res) => {
  const result = validateSet(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });

  const insert = db.prepare(`
    INSERT INTO workout_sets (exercise, weight, reps, logged_at, notes)
    VALUES (@exercise, @weight, @reps, @loggedAt, @notes)
  `);
  const info = insert.run(result.value);
  const created = db.prepare('SELECT * FROM workout_sets WHERE id = ?').get(info.lastInsertRowid);
  return res.status(201).json(toClientShape(created));
});

// READ — return the newest workout sets first.
app.get('/sets', (_req, res) => {
  const rows = db.prepare('SELECT * FROM workout_sets ORDER BY logged_at DESC, id DESC').all();
  res.json(rows.map(toClientShape));
});

// UPDATE — correct an existing set without creating a duplicate.
app.put('/sets/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'A valid set ID is required.' });

  const result = validateSet(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });

  const update = db.prepare(`
    UPDATE workout_sets
    SET exercise = @exercise, weight = @weight, reps = @reps, logged_at = @loggedAt, notes = @notes
    WHERE id = @id
  `);
  const info = update.run({ ...result.value, id });
  if (info.changes === 0) return res.status(404).json({ error: 'Workout set not found.' });

  const updated = db.prepare('SELECT * FROM workout_sets WHERE id = ?').get(id);
  res.json(toClientShape(updated));
});

// DELETE — remove a set logged by mistake.
app.delete('/sets/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'A valid set ID is required.' });

  const info = db.prepare('DELETE FROM workout_sets WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Workout set not found.' });

  res.status(204).send();
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error(error);
  return res.status(500).json({ error: 'Unexpected server error.' });
});

app.listen(PORT, () => {
  console.log(`LiftLedger API running on port ${PORT}`);
});
