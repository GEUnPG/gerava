const pool = require('../database/db');


module.exports = async function transactionMiddleware(req, res, next) {
  const client = await pool.connect();
  try {
    // Inicia a transação
    await client.query('BEGIN');
    // Anexa o client à requisição para uso posterior pelos controllers/models
    req.dbClient = client;
  } catch (err) {
    // Se não conseguimos iniciar a transação, liberamos o client e propagamos o erro
    try { client.release(); } catch(_) {}
    return next(err);
  }

  // 'finish' é emitido quando todos os bytes da resposta foram transmitidos
  // (independente de o socket ainda estar aberto). Aqui finalizamos a tx.
  res.on('finish', async () => {
    try {
      // Comportamento padrão: commit para códigos 2xx/3xx, rollback caso contrário
      if (res.statusCode >= 200 && res.statusCode < 400) {
        await client.query('COMMIT');
        console.log('[transaction] COMMIT');
      } else {
        await client.query('ROLLBACK');
        console.log('[transaction] ROLLBACK (status %s)', res.statusCode);
      }
    } catch (e) {
      // Log de erro: não podemos fazer muito mais aqui. Não relançamos para
      // não quebrar o fluxo de resposta que já está terminando.
      console.error('[transaction] erro ao finalizar transação', e.message);
    } finally {
      // Sempre liberamos o client para retornar ao pool
      try { client.release(); } catch(_) {}
    }
  });

  // 'close' é emitido quando a conexão subjacente é fechada antes da resposta
  // ter sido totalmente escrita. Isso normalmente indica que o cliente desconectou
  // (timeout, cancelamento, etc). Nesse caso, garantimos o rollback.
  res.on('close', async () => {
    // Somente faz rollback se a resposta não foi completamente enviada
    if (!res.writableEnded) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      try { client.release(); } catch(_) {}
      console.log('[transaction] ROLLBACK (connection closed)');
    }
  });

  // Continua para o próximo middleware/handler
  next();
};
