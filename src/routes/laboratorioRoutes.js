const express = require('express');
const router = express.Router();
const LaboratorioController = require('../controllers/LaboratorioController');
const { isAuthenticated } = require('../middleware/auth');

console.log('✅ Carregando src/routes/laboratorioRoutes.js');

router.get('/', isAuthenticated, (req, res, next) => {
  console.log('📩 Acessando GET /api/laboratorios');
  LaboratorioController.getAll(req, res, next);
});

router.get('/:id', isAuthenticated, (req, res, next) => {
  console.log(`📩 Acessando GET /api/laboratorios/${req.params.id}`);
  LaboratorioController.getById(req, res, next);
});

router.post('/', isAuthenticated, (req, res, next) => {
  console.log('📩 Acessando POST /api/laboratorios', req.body);
  LaboratorioController.create(req, res, next);
});

router.put('/:id', isAuthenticated, (req, res, next) => {
  console.log(`📩 Acessando PUT /api/laboratorios/${req.params.id}`, req.body);
  LaboratorioController.update(req, res, next);
});

router.delete('/:id', isAuthenticated, (req, res, next) => {
  console.log(`📩 Acessando DELETE /api/laboratorios/${req.params.id}`);
  LaboratorioController.delete(req, res, next);
});

console.log('✅ Rotas de conjuntos de laboratórios definidas');

module.exports = router;