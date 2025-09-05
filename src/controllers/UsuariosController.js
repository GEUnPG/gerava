const UsuariosModel = require('../models/UsuariosModel');

class UsuariosController {
  // Listar todos os usuários
  static async getAll(req, res) {
    try {
      const usuarios = await UsuariosModel.getAll();
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar usuários', details: error.message });
    }
  }

  // Obter usuário por ID
  static async getById(req, res) {
    try {
      const usuario = await UsuariosModel.getById(req.params.id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar usuário', details: error.message });
    }
  }

  // Criar usuário
  static async create(req, res) {
    try {
      const { nome, username, password } = req.body;
      if (!nome || !username || !password) {
        return res.status(400).json({ error: 'Nome, username e password são obrigatórios' });
      }
      const usuario = await UsuariosModel.create({ nome, username, password });
      res.status(201).json(usuario);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar usuário', details: error.message });
    }
  }

  // Atualizar usuário
  static async update(req, res) {
    try {
      const { nome, username, password } = req.body;
      if (!nome || !username || !password) {
        return res.status(400).json({ error: 'Nome, username e password são obrigatórios' });
      }
      const usuario = await UsuariosModel.update(req.params.id, { nome, username, password });
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar usuário', details: error.message });
    }
  }

  // Excluir usuário
  static async delete(req, res) {
    try {
      const result = await UsuariosModel.delete(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir usuário', details: error.message });
    }
  }
}

module.exports = UsuariosController;