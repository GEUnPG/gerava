const SituacaoAvalModel = require('../models/SituacaoAvalModel');

class SituacaoAvalController {
  static async getAll(req, res) {
    try {
      const search = req.query.search || '';
      const situacoes = search ? await SituacaoAvalModel.search(search) : await SituacaoAvalModel.getAll();
      res.json(situacoes);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar situações', details: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const situacao = await SituacaoAvalModel.getById(req.params.id);
      if (!situacao) {
        return res.status(404).json({ error: 'Situação não encontrada' });
      }
      res.json(situacao);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar situação', details: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { situacao } = req.body;
      if (!situacao) {
        return res.status(400).json({ error: 'Situação é obrigatória' });
      }
      const novaSituacao = await SituacaoAvalModel.create({ situacao });
      res.status(201).json(novaSituacao);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar situação', details: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { situacao } = req.body;
      if (!situacao) {
        return res.status(400).json({ error: 'Situação é obrigatória' });
      }
      const situacaoAtualizada = await SituacaoAvalModel.update(req.params.id, { situacao });
      if (!situacaoAtualizada) {
        return res.status(404).json({ error: 'Situação não encontrada' });
      }
      res.json(situacaoAtualizada);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar situação', details: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const result = await SituacaoAvalModel.delete(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir situação', details: error.message });
    }
  }
}

module.exports = SituacaoAvalController;