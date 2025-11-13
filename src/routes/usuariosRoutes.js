const express = require('express');
const router = express.Router();
const UsuariosController = require('../controllers/UsuariosController');
const transaction = require('../middleware/transaction');
const UsuariosModel = require('../models/UsuariosModel');

// Rotas do CRUD
router.get('/', UsuariosController.getAll); // Listar todos os usuários
router.get('/:id', UsuariosController.getById); // Obter usuário por ID
// Usar middleware de transação nas rotas que modificam dados
router.post('/', transaction, UsuariosController.create); // Criar usuário
router.put('/:id', transaction, UsuariosController.update); // Atualizar usuário
router.delete('/:id', transaction, UsuariosController.delete); // Excluir usuário

module.exports = router;