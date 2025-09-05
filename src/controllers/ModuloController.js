const ModuloModel = require('../models/ModuloModel');

class ModuloController {
  static async getAll(req, res) {
    try {
      const search = req.query.search || '';
      const modulos = search ? await ModuloModel.search(search) : await ModuloModel.getAll();
      res.json(modulos);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar módulos', details: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const modulo = await ModuloModel.getById(req.params.id);
      if (!modulo) {
        return res.status(404).json({ error: 'Módulo não encontrado' });
      }
      res.json(modulo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar módulo', details: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { nome } = req.body;
      if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }
      const novoModulo = await ModuloModel.create({ nome });
      res.status(201).json(novoModulo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar módulo', details: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { nome } = req.body;
      if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }
      const moduloAtualizado = await ModuloModel.update(req.params.id, { nome });
      if (!moduloAtualizado) {
        return res.status(404).json({ error: 'Módulo não encontrado' });
      }
      res.json(moduloAtualizado);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar módulo', details: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const result = await ModuloModel.delete(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir módulo', details: error.message });
    }
  }
}

module.exports = ModuloController;