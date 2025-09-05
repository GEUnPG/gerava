const express = require('express');
const router = express.Router();
const DisciplinaController = require('../controllers/DisciplinaController');
const { isAuthenticated } = require('../middleware/auth');

console.log('✅ Carregando src/routes/disciplinaRoutes.js');

router.get('/modulos', isAuthenticated, DisciplinaController.getModulos);
router.get('/professores', isAuthenticated, DisciplinaController.getProfessores);
router.get('/', isAuthenticated, DisciplinaController.getAll);
router.get('/:id', isAuthenticated, DisciplinaController.getById);
router.post('/', isAuthenticated, DisciplinaController.create);
router.put('/:id', isAuthenticated, DisciplinaController.update);
router.delete('/:id', isAuthenticated, DisciplinaController.delete);

console.log('✅ Rotas de disciplinas definidas');

module.exports = router;