const { Pool } = require('pg');

const poolConfig = {
  connectionString: 'postgresql://foa_med_user:x4jiJoOKtzOlPXFdLH89YlyFshV0kKGt@dpg-d0nn8kqdbo4c73ccftig-a/foa_med',
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