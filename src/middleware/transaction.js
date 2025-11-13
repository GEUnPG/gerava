const pool = require('../database/db');

// Middleware que inicia uma transação e anexa o client em req.dbClient
// Commit/rollback são executados quando a resposta terminar.
module.exports = async function transactionMiddleware(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    req.dbClient = client;
  } catch (err) {
    try { client.release(); } catch(_) {}
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
      try { client.release(); } catch(_) {}
    }
  });

  res.on('close', async () => {
    if (!res.writableEnded) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      try { client.release(); } catch(_) {}
      console.log('[transaction] ROLLBACK (connection closed)');
    }
  });

  next();
};
