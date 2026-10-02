const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


async function initializeDatabase() {

  /* USERS */

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT '',
      pronouns TEXT NOT NULL DEFAULT '',
      profile_picture TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);


  /* ADD NEW PROFILE COLUMNS TO EXISTING USERS */

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS pronouns TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS profile_picture TEXT NOT NULL DEFAULT '';
  `);


  /* FRIENDSHIPS */

  await pool.query(`
    CREATE TABLE IF NOT EXISTS friendships (
      id SERIAL PRIMARY KEY,
      requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      UNIQUE (requester_id, receiver_id)
    );
  `);

}


module.exports = {
  pool,
  initializeDatabase
};
