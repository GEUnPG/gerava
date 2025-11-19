//refatorado 2025-06-10
// db.js utilizado para executar no render
const { Pool } = require('pg');
require('dotenv').config(); // garantir que o .env seja lido em ambiente local

// Configuração do pool: usa DATABASE_URL se disponível, senão usa variáveis DB_*.
const {
  DATABASE_URL,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT,
  DB_SSL,
  NODE_ENV,
} = process.env;

const enableSSL = NODE_ENV === 'production' || DB_SSL === 'true';

const poolConfig = DATABASE_URL
  ? {
      connectionString: DATABASE_URL,
      ...(enableSSL ? { ssl: { rejectUnauthorized: false } } : {}),
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 60000,
    }
  : {
      user: DB_USER || 'postgres',
      host: DB_HOST || 'localhost',
      database: DB_NAME || 'postgres',
      password: DB_PASSWORD || '',
      port: DB_PORT ? Number.parseInt(DB_PORT, 10) : 5432,
      ...(enableSSL ? { ssl: { rejectUnauthorized: false } } : {}),
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 60000,
    };

console.log('✅ Pool configurado com configuração de ambiente.');

const pool = new Pool(poolConfig);

// ✅ SOLUÇÃO: IIFE async para permitir await
(async () => { //NOSONAR
  try {
    const client = await pool.connect();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso.');
    client.release();
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
  }
})();

module.exports = pool;
