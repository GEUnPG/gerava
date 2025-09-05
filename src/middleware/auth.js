function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    console.log(`✅ Autenticado: userId=${req.session.userId}, rota=${req.originalUrl}`);
    return next();
  }
  console.log(`❌ Não autenticado: redirecionando para /login.html, rota=${req.originalUrl}`);
  res.status(401).json({ error: 'Não autorizado. Faça login.' });
}

module.exports = { isAuthenticated };