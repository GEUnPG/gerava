//refatorado em 2024-06-10
//src/controllers/LaboratorioController.js
const Laboratorio = require('../models/LaboratorioModel');

class LaboratorioController {
  // ===== MÉTODOS AUXILIARES PRIVADOS =====

  static validateId(id) {
    const parsedId = Number.parseInt(id);
    if (Number.isNaN(parsedId) || parsedId <= 0) {
      throw new Error('ID inválido');
    }
    return parsedId;
  }

  static validateLaboratorioData(data) {
    const { nome, qtd_com_total, qtd_sem_total } = data;
    if (!nome || qtd_com_total === undefined || qtd_sem_total === undefined) {
      throw new Error('Campos nome, qtd_com_total e qtd_sem_total são obrigatórios');
    }
    return { nome, qtd_com_total, qtd_sem_total };
  }

  static handleError(res, error, defaultMessage, statusCode = 500) {
    console.error(`Erro: ${defaultMessage}`, error.message, error.stack);
    res.status(statusCode).json({ 
      error: defaultMessage, 
      details: error.message 
    });
  }

  static async handleRequest(req, res, handler, logMessage) {
    if (logMessage) {
      console.log(logMessage);
    }
    try {
      await handler();
    } catch (error) {
      const statusCode = error.message.includes('inválido') || 
                         error.message.includes('obrigatórios') ? 400 : 500;
      this.handleError(res, error, error.message, statusCode);
    }
  }

  // ===== CRUD OPERATIONS =====

  static async create(req, res) {
    await this.handleRequest(req, res, async () => {
      const data = this.validateLaboratorioData(req.body);
      const id = await Laboratorio.create(data);
      res.status(201).json({ id });
    }, `Acessando POST /api/laboratorios ${JSON.stringify(req.body)}`);
  }

  static async getAll(req, res) {
    await this.handleRequest(req, res, async () => {
      const search = req.query.search || '';
      const laboratorios = await Laboratorio.findAll(search);
      res.json(laboratorios);
    }, `Acessando GET /api/laboratorios ${JSON.stringify(req.query)}`);
  }

  static async getById(req, res) {
    await this.handleRequest(req, res, async () => {
      const id = this.validateId(req.params.id);
      const laboratorio = await Laboratorio.findById(id);
      
      if (laboratorio) {
        res.json(laboratorio);
      } else {
        res.status(404).json({ error: 'Conjunto não encontrado' });
      }
    }, `Acessando GET /api/laboratorios/${req.params.id}`);
  }

  static async update(req, res) {
    await this.handleRequest(req, res, async () => {
      const id = this.validateId(req.params.id);
      const data = this.validateLaboratorioData(req.body);
      const laboratorio = await Laboratorio.update(id, data);
      
      if (laboratorio) {
        res.json({ message: 'Conjunto atualizado com sucesso' });
      } else {
        res.status(404).json({ error: 'Conjunto não encontrado' });
      }
    }, `Acessando PUT /api/laboratorios/${req.params.id} ${JSON.stringify(req.body)}`);
  }

  static async delete(req, res) {
    await this.handleRequest(req, res, async () => {
      const id = this.validateId(req.params.id);
      await Laboratorio.delete(id);
      res.json({ message: 'Conjunto deletado com sucesso' });
    }, `Acessando DELETE /api/laboratorios/${req.params.id}`);
  }
}

module.exports = LaboratorioController;
