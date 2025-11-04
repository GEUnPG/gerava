//refatorado 2024-06-10
// db.js utilizado para executar no render
const { Pool } = require('pg');
require('dotenv').config(); // garantir que o .env seja lido em ambiente local

// Uso a variável de ambiente DATABASE_URL ou uma string local de fallback
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

// ✅ REFATORADO: Usar async/await ao invés de promise chain
async function initializePool() {
  try {
    const client = await pool.connect();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso.');
    client.release();
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
  }
}

// Chamar a função de inicialização
initializePool();

module.exports = pool;
