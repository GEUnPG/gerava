//refatorado em 2024-06-10
//src/controllers/LaboratorioController.js
const Laboratorio = require('../models/LaboratorioModel');

class LaboratorioController {
  static async create(req, res) {
    console.log('Acessando POST /api/laboratorios', req.body);
    try {
      const { nome, qtd_com_total, qtd_sem_total } = req.body;
      if (!nome || qtd_com_total === undefined || qtd_sem_total === undefined) {
        return res.status(400).json({ error: 'Campos nome, qtd_com_total e qtd_sem_total são obrigatórios' });
      }
      const id = await Laboratorio.create({ nome, qtd_com_total, qtd_sem_total });
      res.status(201).json({ id });
    } catch (error) {
      console.error('Erro em create:', error.message, error.stack);
      res.status(400).json({ error: 'Erro ao criar conjunto', details: error.message });
    }
  }

  static async getAll(req, res) {
    console.log('Acessando GET /api/laboratorios', req.query);
    try {
      const search = req.query.search || '';
      const laboratorios = await Laboratorio.findAll(search);
      res.json(laboratorios);
    } catch (error) {
      console.error('Erro em getAll:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao listar conjuntos', details: error.message });
    }
  }

  static async getById(req, res) {
    console.log(`Acessando GET /api/laboratorios/${req.params.id}`);
    try {
      const id = Number.parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      const laboratorio = await Laboratorio.findById(id);
      if (laboratorio) {
        res.json(laboratorio);
      } else {
        res.status(404).json({ error: 'Conjunto não encontrado' });
      }
    } catch (error) {
      console.error('Erro em getById:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao buscar conjunto', details: error.message });
    }
  }

  static async update(req, res) {
    console.log(`Acessando PUT /api/laboratorios/${req.params.id}`, req.body);
    try {
      const id = Number.parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      const { nome, qtd_com_total, qtd_sem_total } = req.body;
      if (!nome || qtd_com_total === undefined || qtd_sem_total === undefined) {
        return res.status(400).json({ error: 'Campos nome, qtd_com_total e qtd_sem_total são obrigatórios' });
      }
      const laboratorio = await Laboratorio.update(id, { nome, qtd_com_total, qtd_sem_total });
      if (laboratorio) {
        res.json({ message: 'Conjunto atualizado com sucesso' });
      } else {
        res.status(404).json({ error: 'Conjunto não encontrado' });
      }
    } catch (error) {
      console.error('Erro em update:', error.message, error.stack);
      res.status(400).json({ error: 'Erro ao atualizar conjunto', details: error.message });
    }
  }

  static async delete(req, res) {
    console.log(`Acessando DELETE /api/laboratorios/${req.params.id}`);
    try {
      const id = Number.parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      await Laboratorio.delete(id);
      res.json({ message: 'Conjunto deletado com sucesso' });
    } catch (error) {
      console.error('Erro em delete:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao deletar conjunto', details: error.message });
    }
  }
}

module.exports = LaboratorioController;