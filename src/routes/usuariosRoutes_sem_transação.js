const express = require('express');
const router = express.Router();
const UsuariosController = require('../controllers/UsuariosController');

// Rotas do CRUD
router.get('/', UsuariosController.getAll); // Listar todos os usuários
router.get('/:id', UsuariosController.getById); // Obter usuário por ID
router.post('/', UsuariosController.create); // Criar usuário
router.put('/:id', UsuariosController.update); // Atualizar usuário
router.delete('/:id', UsuariosController.delete); // Excluir usuário

module.exports = router;