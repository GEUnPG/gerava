const UsuariosModel = require('../models/UsuariosModel');

// Utilitários para validação
function validarCamposObrigatorios({ nome, username, password }, res) {
  if (!nome || !username || !password) {
    res.status(400).json({ error: 'Nome, username e password são obrigatórios' });
    return false;
  }
  return true;
}

function validarNome(nome, res) {
  const nomeRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;
  if (!nomeRegex.test(nome)) {
    res.status(400).json({ error: 'Nome contém caracteres inválidos' });
    return false;
  }
  return true;
}

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
    const { nome, username, password } = req.body;
    if (!validarCamposObrigatorios({ nome, username, password }, res)) return;
    if (!validarNome(nome, res)) return;

    try {
      const client = req.dbClient || null;
      // checar username único dentro da mesma transação (se houver)
      const existente = await UsuariosModel.getByUsername(username, client);
      if (existente) {
        return res.status(400).json({ error: 'Username já existe' });
      }
      const usuario = await UsuariosModel.create({ nome, username, password }, client);
      res.status(201).json(usuario);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar usuário', details: error.message });
    }
  }

  // Atualizar usuário
  static async update(req, res) {
    const { nome, username, password } = req.body;
    if (!validarCamposObrigatorios({ nome, username, password }, res)) return;
    if (!validarNome(nome, res)) return;

    try {
      const client = req.dbClient || null;
      // opcional: checar se outro usuário já usa o username
      const existente = await UsuariosModel.getByUsername(username, client);
      if (existente && String(existente.id) !== String(req.params.id)) {
        return res.status(400).json({ error: 'Username já existe' });
      }
      const usuario = await UsuariosModel.update(req.params.id, { nome, username, password }, client);
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
      const client = req.dbClient || null;
      const result = await UsuariosModel.delete(req.params.id, client);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir usuário', details: error.message });
    }
  }
}

module.exports = UsuariosController;
