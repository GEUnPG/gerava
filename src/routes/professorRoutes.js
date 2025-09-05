const express = require('express');
const router = express.Router();
const ProfessorController = require('../controllers/ProfessorController');

// Middleware de autenticação
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ error: 'Não autenticado' });
}

// Rotas
router.post('/', isAuthenticated, ProfessorController.create);
router.get('/', isAuthenticated, ProfessorController.getAll);
router.get('/:id', isAuthenticated, ProfessorController.getById);
router.put('/:id', isAuthenticated, ProfessorController.update);
router.delete('/:id', isAuthenticated, ProfessorController.delete);

module.exports = router;