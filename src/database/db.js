const { Pool } = require('pg');

const poolConfig = {
  connectionString: 'postgresql://foa_med_enka_user:gcmIOzBlzbMkmDWCd0KnbSDK74r0GY6k@dpg-d4123gs9c44c73cggpc0-a/foa_med_enka',
  ssl: { rejectUnauthorized: false }, // SSL fixo para o Render
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 60000,
};

console.log('Pool config:', poolConfig);

const pool = new Pool(poolConfig);

pool.connect()
  .then(client => {
    console.log(
      `✅ Conexão com o banco de dados PostgreSQL estabelecida com sucesso ` +
      `(host: Render, database: foa_med)`
    );
    client.release();
  })
  .catch(err => {
    console.error(
      `❌ Erro ao conectar ao banco de dados ` +
      `(host: Render, database: foa_med):`,
      err.message,
      err.stack
    );
  });

module.exports = pool;
