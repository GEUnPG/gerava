// db.js utilizado para executar no render
const { Pool } = require('pg');
require('dotenv').config(); // garante que o .env seja lido em ambiente local

// Usa a variável de ambiente DATABASE_URL ou uma string local de fallback
const connectionString = process.env.DATABASE_URL;
const poolConfig = {
  connectionString,
  ssl: {
    rejectUnauthorized: false, // necessário para Render
  },
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 60000,
};

console.log('✅ Pool configurado com connectionString do ambiente.');

const pool = new Pool(poolConfig);

pool.connect()
  .then(client => {
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso.');
    client.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
  });

module.exports = pool;
