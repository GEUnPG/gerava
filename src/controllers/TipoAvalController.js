const TipoAvalModel = require('../models/TipoAvalModel');

class TipoAvalController {
  static async getAll(req, res) {
    try {
      const search = req.query.search || '';
      const tipos = search ? await TipoAvalModel.search(search) : await TipoAvalModel.getAll();
      res.json(tipos);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar tipos', details: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const tipo = await TipoAvalModel.getById(req.params.id);
      if (!tipo) {
        return res.status(404).json({ error: 'Tipo não encontrado' });
      }
      res.json(tipo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar tipo', details: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { tipo } = req.body;
      if (!tipo) {
        return res.status(400).json({ error: 'Tipo é obrigatório' });
      }
      const novoTipo = await TipoAvalModel.create({ tipo });
      res.status(201).json(novoTipo);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar tipo', details: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { tipo } = req.body;
      if (!tipo) {
        return res.status(400).json({ error: 'Tipo é obrigatório' });
      }
      const tipoAtualizado = await TipoAvalModel.update(req.params.id, { tipo });
      if (!tipoAtualizado) {
        return res.status(404).json({ error: 'Tipo não encontrado' });
      }
      res.json(tipoAtualizado);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar tipo', details: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const result = await TipoAvalModel.delete(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir tipo', details: error.message });
    }
  }
}

module.exports = TipoAvalController;