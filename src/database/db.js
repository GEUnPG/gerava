// src/database/db.js
require('dotenv').config();
const { Pool } = require('pg');

// Detecta se está rodando no Render
const isRender = !!process.env.RENDER || !!process.env.RENDER_SERVICE_ID;
const hasDatabaseUrl = !!process.env.DATABASE_URL;

// 🧩 Cria configuração do pool
let poolConfig;

if (hasDatabaseUrl) {
  // Caso tenha DATABASE_URL (Render interno ou externo)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Necessário para Render (interno ou externo)
    },
  };
} else {
  // Caso local (sem DATABASE_URL)
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
}

// Configurações adicionais
poolConfig.max = 10;
poolConfig.idleTimeoutMillis = 10000;
poolConfig.connectionTimeoutMillis = 60000;

const pool = new Pool(poolConfig);

// Teste de conexão
pool.connect()
  .then(client => {
    const ambiente = hasDatabaseUrl
      ? (isRender ? '🌐 Render.com (produção)' : '💻 Local com DATABASE_URL (Render Externo)')
      : '💻 Localhost (desenvolvimento)';

    console.log('✅ Conexão com o banco de dados PostgreSQL estabelecida com sucesso!');
    console.log(`   → Ambiente: ${ambiente}`);
    console.log(`   → Banco: ${poolConfig.database || '(via DATABASE_URL)'}`);
    console.log(`   → SSL: ${poolConfig.ssl ? 'Ativado' : 'Desativado'}`);

    client.release();
  })
  .catch(err => {
    const ambiente = hasDatabaseUrl
      ? (isRender ? '🌐 Render.com (produção)' : '💻 Local com DATABASE_URL (Render Externo)')
      : '💻 Localhost (desenvolvimento)';

    console.error('❌ Falha ao conectar ao banco de dados:');
    console.error(`   → Ambiente: ${ambiente}`);
    console.error(`   → Erro: ${err.message}`);
  });

module.exports = pool;