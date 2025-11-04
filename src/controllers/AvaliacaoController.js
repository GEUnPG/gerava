//refatorado em 2024-06-10
//src/controllers/AvaliacaoController.js   arrumando
const Avaliacao = require('../models/AvaliacaoModel');
const pool = require('../database/db');

class AvaliacaoController {
  // ===== MÉTODOS AUXILIARES PRIVADOS =====

  static validateId(id) {
    const parsedId = Number.parseInt(id);
    if (Number.isNaN(parsedId) || parsedId <= 0) {
      throw new Error('ID inválido');
    }
    return parsedId;
  }

  static validateNotEmpty(data, fieldName = 'Dados') {
    if (!data || Object.keys(data).length === 0) {
      throw new Error(`${fieldName} são obrigatórios`);
    }
  }

  static validateRequiredFields(data, fields) {
    for (const field of fields) {
      if (!data[field]) {
        throw new Error(`Campo ${field} é obrigatório`);
      }
    }
  }

  static validateBoolean(value, fieldName) {
    if (typeof value !== 'boolean') {
      throw new Error(`O campo ${fieldName} deve ser um booleano`);
    }
  }

  static validateDataFormat(data) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      throw new Error('Data deve estar no formato yyyy-mm-dd');
    }
  }

  static validateHorarioFormat(horario_ini, horario_fim) {
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(horario_ini) || !/^\d{2}:\d{2}(:\d{2})?$/.test(horario_fim)) {
      throw new Error('horario_ini e horario_fim devem estar no formato HH:MM ou HH:MM:SS');
    }
  }

  static handleError(res, error, message, statusCode = 500) {
    console.error(`Erro: ${message}`, error.message, error.stack);
    res.status(statusCode).json({ 
      error: message, 
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
                         error.message.includes('obrigatório') ||
                         error.message.includes('deve ser') ? 400 : 500;
      this.handleError(res, error, error.message, statusCode);
    }
  }

  // ===== CRUD OPERATIONS =====

  static async create(req, res) {
    await this.handleRequest(req, res, async () => {
      this.validateNotEmpty(req.body, 'Dados de avaliação');
      this.validateRequiredFields(req.body, ['disciplina_id', 'data', 'horario_ini', 'horario_fim']);
      
      const id = await Avaliacao.create(req.body);
      res.status(201).json({ id });
    }, 'Acessando POST /api/avaliacoes');
  }

  static async list(req, res) {
    await this.handleRequest(req, res, async () => {
      const page = Number.parseInt(req.query.page) || 1;
      const limit = Number.parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search ? req.query.search.trim() : '';

      const { avaliacoes, total } = await Avaliacao.findAllPaginated({ offset, limit, search });

      res.json({
        data: avaliacoes,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    });
  }

  static async getById(req, res) {
    await this.handleRequest(req, res, async () => {
      const id = this.validateId(req.params.id);
      const avaliacao = await Avaliacao.findById(id);
      
      if (avaliacao) {
        res.json(avaliacao);
      } else {
        res.status(404).json({ error: 'Avaliação não encontrada' });
      }
    }, `Acessando GET /api/avaliacoes/${req.params.id}`);
  }

  static async update(req, res) {
    await this.handleRequest(req, res, async () => {
      const id = this.validateId(req.params.id);
      this.validateNotEmpty(req.body, 'Dados de atualização');
      
      await Avaliacao.update(id, req.body);
      res.json({ message: 'Avaliação atualizada com sucesso' });
    }, `Acessando PUT /api/avaliacoes/${req.params.id}`);
  }

  static async delete(req, res) {
    await this.handleRequest(req, res, async () => {
      const id = this.validateId(req.params.id);
      await Avaliacao.delete(id);
      res.json({ message: 'Avaliação deletada com sucesso' });
    }, `Acessando DELETE /api/avaliacoes/${req.params.id}`);
  }

  // ===== UPDATE OPERATIONS =====

  static async updateVisivel(req, res) {
    await this.handleRequest(req, res, async () => {
      const id = this.validateId(req.params.id);
      const { visivel } = req.body;
      this.validateBoolean(visivel, 'visivel');
      
      const avaliacao = await Avaliacao.updateVisivel(id, visivel);
      res.json({ 
        message: `Avaliação ${visivel ? 'tornada visível' : 'tornada invisível'} com sucesso`, 
        avaliacao 
      });
    }, `Acessando PATCH /api/avaliacoes/${req.params.id}/visivel`);
  }

  static async updateDeleteLogico(req, res) {
    await this.handleRequest(req, res, async () => {
      const id = this.validateId(req.params.id);
      const { delete_logico } = req.body;
      this.validateBoolean(delete_logico, 'delete_logico');
      
      const avaliacao = await Avaliacao.updateDeleteLogico(id, delete_logico);
      res.json({ 
        message: `Avaliação ${delete_logico ? 'deletada logicamente' : 'restaurada'} com sucesso`, 
        avaliacao 
      });
    }, `Acessando PATCH /api/avaliacoes/${req.params.id}/delete-logico`);
  }

  // ===== GETTER METHODS =====

  static async getProfessores(req, res) {
    await this.handleRequest(req, res, async () => {
      const professores = await Avaliacao.findAllProfessores();
      res.json(professores);
    }, 'Acessando GET /api/avaliacoes/professores');
  }

  static async getDisciplinas(req, res) {
    await this.handleRequest(req, res, async () => {
      const disciplinas = await Avaliacao.findAllDisciplinas();
      res.json(disciplinas);
    }, 'Acessando GET /api/avaliacoes/disciplinas');
  }

  static async getModulos(req, res) {
    await this.handleRequest(req, res, async () => {
      const modulos = await Avaliacao.findAllModulos();
      console.log('Módulos encontrados:', modulos);
      res.json(modulos);
    }, 'Acessando GET /api/avaliacoes/modulos');
  }

  static async getAllLaboratorios(req, res) {
    await this.handleRequest(req, res, async () => {
      const result = await pool.query('SELECT id, nome, qtd_com_total, qtd_sem_total FROM laboratorio_conjuntos');
      console.log('Conjuntos de laboratórios encontrados:', result.rows);
      res.json(result.rows);
    }, 'Acessando GET /api/avaliacoes/all-laboratorios');
  }

  static async getAvailableLaboratorios(req, res) {
    await this.handleRequest(req, res, async () => {
      const { data, horario_ini, horario_fim, qtd_alunos, caip } = req.query;
      
      this.validateRequiredFields(
        { data, horario_ini, horario_fim, qtd_alunos },
        ['data', 'horario_ini', 'horario_fim', 'qtd_alunos']
      );
      
      const qtdAlunosInt = Number.parseInt(qtd_alunos);
      if (Number.isNaN(qtdAlunosInt) || qtdAlunosInt <= 0) {
        throw new Error('qtd_alunos deve ser um número positivo');
      }
      
      this.validateDataFormat(data);
      this.validateHorarioFormat(horario_ini, horario_fim);
      
      const laboratorios = await Avaliacao.findAvailableLaboratorios({
        data,
        horario_ini,
        horario_fim,
        qtd_alunos: qtdAlunosInt,
        caip: caip === 'true'
      });
      
      console.log('Laboratórios disponíveis encontrados:', laboratorios);
      res.json(laboratorios);
    }, 'Acessando GET /api/avaliacoes/available-laboratorios');
  }

  static async getSituacoes(req, res) {
    await this.handleRequest(req, res, async () => {
      const situacoes = await Avaliacao.findAllSituacoes();
      res.json(situacoes);
    }, 'Acessando GET /api/avaliacoes/situacoes');
  }

  static async getTipos(req, res) {
    await this.handleRequest(req, res, async () => {
      const tipos = await Avaliacao.findAllTipos();
      res.json(tipos);
    }, 'Acessando GET /api/avaliacoes/tipos');
  }
}

module.exports = AvaliacaoController;
