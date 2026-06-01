//usuariosRoutes.js de acordo com o novo controller e middleware para transações. jogar para o repositório
const express = require('express');
const router = express.Router();
const UsuariosController = require('../controllers/UsuariosController');
const validateUser = require('../middleware/validateUser'); // 🔥 ajuste singular/plural conforme sua pasta

// Rotas do CRUD
router.get('/', UsuariosController.getAll);
router.get('/:id', UsuariosController.getById);
router.post('/', validateUser, UsuariosController.create);   // valida antes de criar
router.put('/:id', validateUser, UsuariosController.update); // valida antes de atualizar
router.delete('/:id', UsuariosController.delete);

module.exports = router;
