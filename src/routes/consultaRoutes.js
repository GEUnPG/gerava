// src/routes/consultaRoutes.js
const express = require('express');
const router = express.Router();
const ConsultaController = require('../controllers/ConsultaController');

console.log('✅ Carregando src/routes/consultaRoutes.js');

// Rota pública para listar avaliações
router.get('/public', (req, res, next) => {
  console.log('📩 Acessando GET /api/avaliacoes/public');
  ConsultaController.listPublic(req, res, next);
});

console.log('✅ Rotas definidas em consultaRoutes');

module.exports = router; //