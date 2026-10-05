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
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);


  /* ADD NEW PROFILE COLUMNS TO EXISTING USERS */

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS pronouns TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS profile_picture TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
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


  /* =========================
     MATCHES
  ========================= */

  await pool.query(`
    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,

      match_code TEXT NOT NULL UNIQUE,

      host_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

      match_name TEXT NOT NULL DEFAULT '',

      time_limit INTEGER NOT NULL DEFAULT 10,

      turn_time INTEGER NOT NULL DEFAULT 30,

      max_players INTEGER NOT NULL DEFAULT 4,

      friends_only BOOLEAN NOT NULL DEFAULT TRUE,

      late_joining BOOLEAN NOT NULL DEFAULT FALSE,

      match_access TEXT NOT NULL DEFAULT 'friends',

      allow_rematch BOOLEAN NOT NULL DEFAULT TRUE,

      match_chat BOOLEAN NOT NULL DEFAULT TRUE,

      reveal_results BOOLEAN NOT NULL DEFAULT TRUE,

      status TEXT NOT NULL DEFAULT 'lobby',

      current_player_id INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      started_at TIMESTAMPTZ,

      ended_at TIMESTAMPTZ
    );
  `);


  /* =========================
     MATCH PLAYERS
  ========================= */

  await pool.query(`
    CREATE TABLE IF NOT EXISTS match_players (
      id SERIAL PRIMARY KEY,

      match_id INTEGER NOT NULL
        REFERENCES matches(id)
        ON DELETE CASCADE,

      user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

      score INTEGER NOT NULL DEFAULT 0,

      is_host BOOLEAN NOT NULL DEFAULT FALSE,

      joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      UNIQUE (match_id, user_id)
    );
  `);

}


module.exports = {
  pool,
  initializeDatabase
};
