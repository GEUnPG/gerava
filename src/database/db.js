require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

poolConfig.max = 10;
poolConfig.idleTimeoutMillis = 10000;
poolConfig.connectionTimeoutMillis = 60000;

const pool = new Pool(poolConfig);

pool.connect()
  .then(client => {
    console.log(
      `✅ Conexão com o banco de dados PostgreSQL estabelecida com sucesso ` +
      `(host: ${poolConfig.connectionString ? 'Render' : poolConfig.host}, database: ${poolConfig.database || 'foa_med'})`
    );
    client.release();
  })
  .catch(err => {
    console.error(
      `❌ Erro ao conectar ao banco de dados ` +
      `(host: ${poolConfig.connectionString ? 'Render' : poolConfig.host}, database: ${poolConfig.database || 'foa_med'}):`,
      err.message,
      err.stack
    );
  });

module.exports = pool;