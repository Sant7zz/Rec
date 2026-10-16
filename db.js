require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL UNIQUE,
      descricao TEXT
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS livros (
      id SERIAL PRIMARY KEY,
      titulo VARCHAR(200) NOT NULL,
      autor VARCHAR(150) NOT NULL,
      ano INTEGER,
      categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT
    )
  `);
}

module.exports = { pool, init };
