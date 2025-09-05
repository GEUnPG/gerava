// arrumando
const Avaliacao = require('../models/AvaliacaoModel');
const pool = require('../database/db');

class AvaliacaoController {
  static async create(req, res) {
    console.log('Acessando POST /api/avaliacoes');
    try {
      const data = req.body;
      if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'Dados de avaliação são obrigatórios' });
      }
      if (!data.disciplina_id || !data.data || !data.horario_ini || !data.horario_fim) {
        return res.status(400).json({ error: 'Campos disciplina_id, data, horario_ini e horario_fim são obrigatórios' });
      }
      const id = await Avaliacao.create(data);
      res.status(201).json({ id });
    } catch (error) {
      console.error('Erro em create:', error.message, error.stack);
      res.status(400).json({ error: 'Erro ao criar avaliação', details: error.message });
    }
  }

  static async list(req, res) {
    console.log('Acessando GET /api/avaliacoes');
    try {
      const avaliacoes = await Avaliacao.findAll();
      res.json(avaliacoes);
    } catch (error) {
      console.error('Erro em list:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao listar avaliações', details: error.message });
    }
  }

  static async getById(req, res) {
    console.log(`Acessando GET /api/avaliacoes/${req.params.id}`);
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      const avaliacao = await Avaliacao.findById(id);
      if (avaliacao) {
        res.json(avaliacao);
      } else {
        res.status(404).json({ error: 'Avaliação não encontrada' });
      }
    } catch (error) {
      console.error('Erro em getById:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao buscar avaliação', details: error.message });
    }
  }

  static async update(req, res) {
    console.log(`Acessando PUT /api/avaliacoes/${req.params.id}`);
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      const data = req.body;
      if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'Dados de atualização são obrigatórios' });
      }
      await Avaliacao.update(id, data);
      res.json({ message: 'Avaliação atualizada com sucesso' });
    } catch (error) {
      console.error('Erro em update:', error.message, error.stack);
      res.status(400).json({ error: 'Erro ao atualizar avaliação', details: error.message });
    }
  }

  static async delete(req, res) {
    console.log(`Acessando DELETE /api/avaliacoes/${req.params.id}`);
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      await Avaliacao.delete(id);
      res.json({ message: 'Avaliação deletada com sucesso' });
    } catch (error) {
      console.error('Erro em delete:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao deletar avaliação', details: error.message });
    }
  }

  static async updateVisivel(req, res) {
    console.log(`Acessando PATCH /api/avaliacoes/${req.params.id}/visivel`);
    try {
      const id = parseInt(req.params.id);
      const { visivel } = req.body;
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      if (typeof visivel !== 'boolean') {
        return res.status(400).json({ error: 'O campo visivel deve ser um booleano' });
      }
      const avaliacao = await Avaliacao.updateVisivel(id, visivel);
      res.json({ message: `Avaliação ${visivel ? 'tornada visível' : 'tornada invisível'} com sucesso`, avaliacao });
    } catch (error) {
      console.error('Erro em updateVisivel:', error.message, error.stack);
      res.status(400).json({ error: 'Erro ao atualizar visibilidade', details: error.message });
    }
  }

  static async updateDeleteLogico(req, res) {
    console.log(`Acessando PATCH /api/avaliacoes/${req.params.id}/delete-logico`);
    try {
      const id = parseInt(req.params.id);
      const { delete_logico } = req.body;
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      if (typeof delete_logico !== 'boolean') {
        return res.status(400).json({ error: 'O campo delete_logico deve ser um booleano' });
      }
      const avaliacao = await Avaliacao.updateDeleteLogico(id, delete_logico);
      res.json({ message: `Avaliação ${delete_logico ? 'deletada logicamente' : 'restaurada'} com sucesso`, avaliacao });
    } catch (error) {
      console.error('Erro em updateDeleteLogico:', error.message, error.stack);
      res.status(400).json({ error: 'Erro ao atualizar deleção lógica', details: error.message });
    }
  }

  static async getProfessores(req, res) {
    console.log('Acessando GET /api/avaliacoes/professores');
    try {
      const professores = await Avaliacao.findAllProfessores();
      res.json(professores);
    } catch (error) {
      console.error('Erro em getProfessores:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao buscar professores', details: error.message });
    }
  }

  static async getDisciplinas(req, res) {
    console.log('Acessando GET /api/avaliacoes/disciplinas');
    try {
      const disciplinas = await Avaliacao.findAllDisciplinas();
      res.json(disciplinas);
    } catch (error) {
      console.error('Erro em getDisciplinas:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao buscar disciplinas', details: error.message });
    }
  }

  static async getModulos(req, res) {
    console.log('Acessando GET /api/avaliacoes/modulos');
    try {
      const modulos = await Avaliacao.findAllModulos();
      console.log('Módulos encontrados:', modulos);
      res.json(modulos);
    } catch (error) {
      console.error('Erro em getModulos:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao buscar módulos', details: error.message });
    }
  }

  static async getAllLaboratorios(req, res) {
    console.log('Acessando GET /api/avaliacoes/all-laboratorios');
    try {
      const result = await pool.query('SELECT id, nome, qtd_com_total, qtd_sem_total FROM laboratorio_conjuntos');
      console.log('Conjuntos de laboratórios encontrados:', result.rows);
      res.json(result.rows);
    } catch (error) {
      console.error('Erro em getAllLaboratorios:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao buscar todos os laboratórios', details: error.message });
    }
  }

  static async getAvailableLaboratorios(req, res) {
    console.log('Acessando GET /api/avaliacoes/available-laboratorios', req.query);
    try {
      const { data, horario_ini, horario_fim, qtd_alunos, caip } = req.query;
      if (!data || !horario_ini || !horario_fim || !qtd_alunos) {
        return res.status(400).json({ error: 'Campos data, horario_ini, horario_fim e qtd_alunos são obrigatórios' });
      }
      const qtdAlunosInt = parseInt(qtd_alunos);
      if (isNaN(qtdAlunosInt) || qtdAlunosInt <= 0) {
        return res.status(400).json({ error: 'qtd_alunos deve ser um número positivo' });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return res.status(400).json({ error: 'Data deve estar no formato yyyy-mm-dd' });
      }
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(horario_ini) || !/^\d{2}:\d{2}(:\d{2})?$/.test(horario_fim)) {
        return res.status(400).json({ error: 'horario_ini e horario_fim devem estar no formato HH:MM ou HH:MM:SS' });
      }
      const laboratorios = await Avaliacao.findAvailableLaboratorios({
        data,
        horario_ini,
        horario_fim,
        qtd_alunos: qtdAlunosInt,
        caip: caip === 'true'
      });
      console.log('Laboratórios disponíveis encontrados:', laboratorios);
      res.json(laboratorios);
    } catch (error) {
      console.error('Erro em getAvailableLaboratorios:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao buscar laboratórios disponíveis', details: error.message });
    }
  }

  static async getSituacoes(req, res) {
    console.log('Acessando GET /api/avaliacoes/situacoes');
    try {
      const situacoes = await Avaliacao.findAllSituacoes();
      res.json(situacoes);
    } catch (error) {
      console.error('Erro em getSituacoes:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao buscar situações', details: error.message });
    }
  }

  static async getTipos(req, res) {
    console.log('Acessando GET /api/avaliacoes/tipos');
    try {
      const tipos = await Avaliacao.findAllTipos();
      res.json(tipos);
    } catch (error) {
      console.error('Erro em getTipos:', error.message, error.stack);
      res.status(500).json({ error: 'Erro ao buscar tipos', details: error.message });
    }
  }
}

module.exports = AvaliacaoController;