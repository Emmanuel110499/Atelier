import pg from 'pg';

export function createRepository(connectionString, PoolClass = pg.Pool) {
  const pool = new PoolClass({ connectionString, connectionTimeoutMillis: 5000 });
  pool.on('error', error => console.error('Connexion PostgreSQL interrompue:', error.message));
  return {
    async init() {
      await pool.query(`CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        title VARCHAR(120) NOT NULL,
        description VARCHAR(2000) NOT NULL DEFAULT '',
        requester VARCHAR(80) NOT NULL,
        priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'normal', 'high')),
        status VARCHAR(15) NOT NULL CHECK (status IN ('new', 'in_progress', 'done')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    },
    async health() { await pool.query('SELECT 1'); },
    async list() { return (await pool.query('SELECT * FROM tickets ORDER BY id DESC')).rows; },
    async create(ticket) {
      const { title, description, requester, priority } = ticket;
      return (await pool.query(`INSERT INTO tickets (title, description, requester, priority, status)
        VALUES ($1,$2,$3,$4,'new') RETURNING *`, [title, description, requester, priority])).rows[0];
    },
    async update(id, status) {
      return (await pool.query('UPDATE tickets SET status=$1 WHERE id=$2 RETURNING *', [status, id])).rows[0];
    },
    async remove(id) { return (await pool.query('DELETE FROM tickets WHERE id=$1 RETURNING id', [id])).rowCount > 0; },
    async close() { await pool.end(); }
  };
}
