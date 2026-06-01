//src/routes/avaliacaoRoutes.js arrumando
const express = require('express');
const router = express.Router();
const AvaliacaoController = require('../controllers/AvaliacaoController');
const { isAuthenticated } = require('../middleware/auth');

console.log('✅ Carregando src/routes/avaliacaoRoutes.js');

// Rota pública
router.get('/', (req, res, next) => {
  console.log('📩 Acessando GET /api/avaliacoes');
  AvaliacaoController.list(req, res, next);
});

router.get('/professores', (req, res, next) => {
  console.log('📩 Acessando GET /api/avaliacoes/professores');
  AvaliacaoController.getProfessores(req, res, next);
});

router.get('/disciplinas', (req, res, next) => {
  console.log('📩 Acessando GET /api/avaliacoes/disciplinas');
  AvaliacaoController.getDisciplinas(req, res, next);
});

router.get('/all-laboratorios', (req, res, next) => {
  console.log('📩 Acessando GET /api/avaliacoes/all-laboratorios');
  AvaliacaoController.getAllLaboratorios(req, res, next);
});

router.get('/modulos', (req, res, next) => {
  console.log('📩 Acessando GET /api/avaliacoes/modulos');
  AvaliacaoController.getModulos(req, res, next);
});

router.get('/situacoes', (req, res, next) => {
  console.log('📩 Acessando GET /api/avaliacoes/situacoes');
  AvaliacaoController.getSituacoes(req, res, next);
});

router.get('/tipos', (req, res, next) => {
  console.log('📩 Acessando GET /api/avaliacoes/tipos');
  AvaliacaoController.getTipos(req, res, next);
});

router.get('/available-laboratorios', isAuthenticated, (req, res, next) => {
  console.log('📩 Acessando GET /api/avaliacoes/available-laboratorios', req.query);
  AvaliacaoController.getAvailableLaboratorios(req, res, next);
});

router.post('/', isAuthenticated, (req, res, next) => {
  console.log('📩 Acessando POST /api/avaliacoes', req.body);
  AvaliacaoController.create(req, res, next);
});

router.get('/:id', (req, res, next) => {
  console.log(`📩 Acessando GET /api/avaliacoes/${req.params.id}`);
  AvaliacaoController.getById(req, res, next);
});

router.put('/:id', isAuthenticated, (req, res, next) => {
  console.log(`📩 Acessando PUT /api/avaliacoes/${req.params.id}`, req.body);
  AvaliacaoController.update(req, res, next);
});

// router.delete('/:id', isAuthenticated, (req, res, next) => {
//   console.log(`📩 Acessando DELETE /api/avaliacoes/${req.params.id}`);
//   AvaliacaoController.delete(req, res, next);
// });

router.patch('/:id/visivel', isAuthenticated, (req, res, next) => {
  console.log(`📩 Acessando PATCH /api/avaliacoes/${req.params.id}/visivel`, req.body);
  AvaliacaoController.updateVisivel(req, res, next);
});

router.patch('/:id/delete-logico', isAuthenticated, (req, res, next) => {
  console.log(`📩 Acessando PATCH /api/avaliacoes/${req.params.id}/delete-logico`, req.body);
  AvaliacaoController.updateDeleteLogico(req, res, next);
});

console.log('✅ Rotas definidas em avaliacaoRoutes');

module.exports = router;