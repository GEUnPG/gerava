// src/routes/consultaRoutes.js
const express = require('express');
const router = express.Router();
const ConsultaController = require('../controllers/ConsultaController');

console.log('✅ Carregando src/routes/consultaRoutes.js');

// rota pública com paginação
router.get('/public', ConsultaController.listPublic);

// rota pública sem paginação (pesquisa avançada)
router.get('/public-all', ConsultaController.listAll);

console.log('✅ Rotas definidas em consultaRoutes');

module.exports = router;
