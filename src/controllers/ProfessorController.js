const ProfessorModel = require('../models/ProfessorModel');

class ProfessorController {
  // Criar professor
  static async create(req, res) {
    const { nome } = req.body;
    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      return res.status(400).json({ error: 'Nome é obrigatório e deve ser uma string válida.' });
    }
    try {
      const professor = await ProfessorModel.create(nome.trim());
      res.status(201).json(professor);
    } catch (error) {
      console.error('Erro no controller create:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  // Listar professores
  static async getAll(req, res) {
    const { search } = req.query;
    try {
      const professores = await ProfessorModel.findAll(search);
      res.status(200).json(professores);
    } catch (error) {
      console.error('Erro no controller getAll:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  // Obter professor por ID
  static async getById(req, res) {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido.' });
    }
    try {
      const professor = await ProfessorModel.findById(id);
      res.status(200).json(professor);
    } catch (error) {
      console.error('Erro no controller getById:', error.message);
      res.status(error.message.includes('não encontrado') ? 404 : 500).json({ error: error.message });
    }
  }

  // Atualizar professor
  static async update(req, res) {
    const { id } = req.params;
    const { nome } = req.body;
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido.' });
    }
    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      return res.status(400).json({ error: 'Nome é obrigatório e deve ser uma string válida.' });
    }
    try {
      const professor = await ProfessorModel.update(id, nome.trim());
      res.status(200).json(professor);
    } catch (error) {
      console.error('Erro no controller update:', error.message);
      res.status(error.message.includes('não encontrado') ? 404 : 500).json({ error: error.message });
    }
  }

  // Deletar professor
  static async delete(req, res) {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido.' });
    }
    try {
      await ProfessorModel.delete(id);
      res.status(200).json({ message: 'Professor excluído com sucesso.' });
    } catch (error) {
      console.error('Erro no controller delete:', error.message);
      res.status(error.message.includes('não encontrado') ? 404 : 500).json({ error: error.message });
    }
  }
}

module.exports = ProfessorController;