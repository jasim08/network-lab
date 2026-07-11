const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 8080),
  user: process.env.PGUSER || 'user',
  password: process.env.PGPASSWORD || 'password',
  database: process.env.PGDATABASE || 'postgres',
});

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      )
    `);
    console.log('Database ready');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
  }
}

initDb();

app.get('/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as now');
    res.json({ ok: true, now: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/users', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, source_ip FROM access_logs ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/users', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ ok: false, error: 'name is required' });
  }

  try {
    const result = await pool.query('INSERT INTO users (name) VALUES ($1) RETURNING id, name', [name]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/', (_req, res) => {
  res.send('Simple Node + PostgreSQL lab server');
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
