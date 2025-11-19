const pool = require('../database/db');
module.exports = async function transactionMiddleware(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    req.dbClient = client;
  } catch (err) {
    // Se não conseguimos iniciar a transação, liberamos o client e propagamos o erro
    try {
        client.release();
    } catch (error_) {
        console.error('Erro ao liberar client:', error_); // CORREÇÃO AQ
    }
    return next(err);
  }

  res.on('finish', async () => {
    try {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        await client.query('COMMIT');
        console.log('[transaction] COMMIT');
      } else {
        await client.query('ROLLBACK');
        console.log('[transaction] ROLLBACK (status %s)', res.statusCode);
      }
    } catch (e) {
      console.error('[transaction] erro ao finalizar transação', e.message);
    } finally {
      try {
        client.release();
      } catch (error_) {
        console.error('Erro ao liberar client:', error_); // MESMA CORREÇÃO AQ
      }
    }
  });
  res.on('close', async () => {
    if (!res.writableEnded) {
      try {
        await client.query('ROLLBACK');
      } catch (error_) {
        console.error('Erro ao fazer rollback:', error_);
      }
      try {
        client.release();
      } catch (error_) {
        console.error('Erro ao liberar client:', error_); // NOVAMENTE
      }
      console.log('[transaction] ROLLBACK (connection closed)');
    }
  });
  next();
};
