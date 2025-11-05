//refatorado em 2025-11-06
// src/models/AvaliacaoModel.js  rumando
const pool = require('../database/db');
const erro_prof = 'modulo_id, disciplina_id e professor_id devem ser números inteiros';

class Avaliacao {
  // ===== MÉTODOS DE VALIDAÇÃO CENTRALIZADOS =====

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

  static validateQtdAlunos(qtd_alunos) {
    if (!Number.isInteger(qtd_alunos) || qtd_alunos <= 0) {
      throw new Error('qtd_alunos deve ser um número inteiro positivo');
    }
  }

  static validateIntegerIds(modulo_id, disciplina_id, professor_id) {
    if (!Number.isInteger(modulo_id) || !Number.isInteger(disciplina_id) || !Number.isInteger(professor_id)) {
      throw new TypeError(erro_prof);
    }
  }

  static validateRequiredFields(data, fields) {
    for (const field of fields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        throw new Error(`Campo obrigatório faltando: ${field}`);
      }
    }
  }

  // ===== MÉTODOS AUXILIARES PARA QUERIES =====

  static async fetchLaboratoriosForAvaliacao(avaliacaoId) {
    const result = await pool.query(
      `SELECT lc.id, lc.nome, lc.qtd_com_total, lc.qtd_sem_total
       FROM laboratorio_conjuntos lc
       JOIN avaliacao_laboratorio al ON lc.id = al.conjunto_id
       WHERE al.avaliacao_id = $1`,
      [avaliacaoId]
    );
    return result.rows;
  }

  static async insertLaboratorios(avaliacaoId, laboratorios) {
    if (laboratorios && laboratorios.length > 0) {
      for (const conjuntoId of laboratorios) {
        await pool.query(
          'INSERT INTO avaliacao_laboratorio (avaliacao_id, conjunto_id) VALUES ($1, $2)',
          [avaliacaoId, conjuntoId]
        );
      }
    }
  }

  static async createNotification(avaliacaoId, tipoAlteracao) {
    await pool.query(
      `INSERT INTO notificacoes_avaliacao (avaliacao_id, tipo_alteracao) VALUES ($1, $2)`,
      [avaliacaoId, tipoAlteracao]
    );
  }

  // ===== VALIDAÇÃO DE LABORATÓRIOS =====

  static async validateLaboratorios(data, avaliacaoId = null) {
    const { data: dataAvaliacao, horario_ini, horario_fim, qtd_alunos, caip, laboratorios } = data;

    this.validateRequiredFields(
      { dataAvaliacao, horario_ini, horario_fim, qtd_alunos, caip, laboratorios },
      ['dataAvaliacao', 'horario_ini', 'horario_fim', 'qtd_alunos', 'laboratorios']
    );

    if (!Array.isArray(laboratorios)) {
      throw new TypeError('laboratorios deve ser um array');
    }

    this.validateDataFormat(dataAvaliacao);
    this.validateHorarioFormat(horario_ini, horario_fim);
    this.validateQtdAlunos(qtd_alunos);

    if (laboratorios.length === 0) {
      throw new Error('Pelo menos um laboratório deve ser especificado');
    }

    for (const conjuntoId of laboratorios) {
      const result = await pool.query(`
        SELECT a.id
        FROM avaliacao a
        JOIN avaliacao_laboratorio al ON a.id = al.avaliacao_id
        WHERE al.conjunto_id = $1
        AND a.data = $2
        AND a.horario_ini IS NOT NULL
        AND a.horario_fim IS NOT NULL
        AND (
          (a.horario_ini <= $3 AND a.horario_fim >= $4) OR
          (a.horario_ini >= $4 AND a.horario_ini < $3) OR
          (a.horario_fim > $4 AND a.horario_fim <= $3)
        )
        AND a.id != $5
      `, [conjuntoId, dataAvaliacao, horario_fim, horario_ini, avaliacaoId || -1]);

      if (result.rows.length > 0) {
        throw new Error(`O conjunto de laboratórios ${conjuntoId} já está agendado para o horário selecionado.`);
      }

      const conjuntoResult = await pool.query(`
        SELECT qtd_com_total, qtd_sem_total
        FROM laboratorio_conjuntos
        WHERE id = $1
      `, [conjuntoId]);

      if (conjuntoResult.rows.length === 0) {
        throw new Error(`O conjunto de laboratórios ${conjuntoId} não existe.`);
      }

      const conjunto = conjuntoResult.rows[0];
      const capacidade = caip ? conjunto.qtd_com_total : conjunto.qtd_sem_total;
      if (qtd_alunos > capacidade) {
        throw new Error(`O conjunto ${conjuntoId} não tem capacidade suficiente para ${qtd_alunos} alunos (capacidade: ${capacidade}).`);
      }
    }
  }

  // ===== CRUD OPERATIONS =====

  static async create(inputData) {
    const { situacao, tipo, data, horario_ini, horario_fim, qtd_alunos, caip, modulo_id, disciplina_id, professor_id, qtd_objetiva, qtd_discursiva, laboratorios } = inputData;

    this.validateRequiredFields(inputData, [
      'situacao', 'tipo', 'data', 'horario_ini', 'horario_fim', 'qtd_alunos', 'caip', 'modulo_id', 'disciplina_id', 'professor_id'
    ]);

    this.validateDataFormat(data);
    this.validateHorarioFormat(horario_ini, horario_fim);
    this.validateQtdAlunos(qtd_alunos);
    this.validateIntegerIds(modulo_id, disciplina_id, professor_id);

    await this.validateLaboratorios(inputData);

    const result = await pool.query(
      `INSERT INTO avaliacao (situacao, tipo, data, horario_ini, horario_fim, qtd_alunos, caip, modulo_id, disciplina_id, professor_id, qtd_objetiva, qtd_discursiva, visivel, delete_logico)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE, FALSE)
       RETURNING id`,
      [situacao, tipo, data, horario_ini, horario_fim, qtd_alunos, caip, modulo_id, disciplina_id, professor_id, qtd_objetiva || null, qtd_discursiva || null]
    );
    const avaliacaoId = result.rows[0].id;

    await this.insertLaboratorios(avaliacaoId, laboratorios);
    await this.createNotification(avaliacaoId, 'CREATE');

    return avaliacaoId;
  }

  static async update(id, inputData) {
    const { situacao, tipo, data, horario_ini, horario_fim, qtd_alunos, caip, modulo_id, disciplina_id, professor_id, qtd_objetiva, qtd_discursiva, laboratorios } = inputData;

    this.validateRequiredFields(inputData, [
      'situacao', 'tipo', 'data', 'horario_ini', 'horario_fim', 'qtd_alunos', 'caip', 'modulo_id', 'disciplina_id', 'professor_id'
    ]);

    this.validateDataFormat(data);
    this.validateHorarioFormat(horario_ini, horario_fim);
    this.validateQtdAlunos(qtd_alunos);
    this.validateIntegerIds(modulo_id, disciplina_id, professor_id);

    await this.validateLaboratorios(inputData, id);

    await pool.query(
      `UPDATE avaliacao
       SET situacao = $1, tipo = $2, data = $3, horario_ini = $4, horario_fim = $5, qtd_alunos = $6, caip = $7, modulo_id = $8, disciplina_id = $9, professor_id = $10, qtd_objetiva = $11, qtd_discursiva = $12
       WHERE id = $13`,
      [situacao, tipo, data, horario_ini, horario_fim, qtd_alunos, caip, modulo_id, disciplina_id, professor_id, qtd_objetiva || null, qtd_discursiva || null, id]
    );

    await pool.query('DELETE FROM avaliacao_laboratorio WHERE avaliacao_id = $1', [id]);
    await this.insertLaboratorios(id, laboratorios);
    await this.createNotification(id, 'UPDATE');
  }

  static async delete(id) {
    await this.createNotification(id, 'DELETE');
    await pool.query('DELETE FROM avaliacao_laboratorio WHERE avaliacao_id = $1', [id]);
    await pool.query('DELETE FROM avaliacao WHERE id = $1', [id]);
  }

  // ===== READ OPERATIONS =====

  static async findAll() {
    console.log('Executando findAll em AvaliacaoModel');
    try {
      const result = await pool.query(`
        SELECT a.*, m.nome AS modulo_nome, d.descricao AS disciplina_nome, p.nome AS professor_nome, s.situacao AS situacao_nome, t.tipo AS tipo_nome
        FROM avaliacao a
        LEFT JOIN modulo m ON a.modulo_id = m.id
        LEFT JOIN disciplina d ON a.disciplina_id = d.id
        LEFT JOIN professor p ON a.professor_id = p.id
        LEFT JOIN situacao_aval s ON a.situacao = s.situacao
        LEFT JOIN tipo_aval t ON a.tipo = t.tipo
        WHERE a.delete_logico = FALSE
        ORDER BY a.data ASC, a.horario_ini ASC
      `);
      console.log('Consulta principal executada, linhas retornadas:', result.rows.length);
      const avaliacoes = result.rows;

      for (const avaliacao of avaliacoes) {
        avaliacao.laboratorios = await this.fetchLaboratoriosForAvaliacao(avaliacao.id);
      }
      console.log('Avaliações encontradas:', avaliacoes.length);
      return avaliacoes;
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error.message, error.stack);
      throw new Error(`Erro na consulta ao banco de dados: ${error.message}`);
    }
  }

  static async findAllPaginated({ offset, limit, search }) {
    let whereClause = 'WHERE a.delete_logico = FALSE';
    let params = [];
    
    if (search) {
      whereClause += ` AND (a.data::text ILIKE $1 OR m.nome ILIKE $1 OR p.nome ILIKE $1 OR a.horario_ini::text ILIKE $1)`;
      params.push(`%${search}%`);
    }
    params.push(limit, offset);

    const listQuery = `
      SELECT a.*, m.nome AS modulo_nome, d.descricao AS disciplina_nome, p.nome AS professor_nome, s.situacao AS situacao_nome, t.tipo AS tipo_nome
      FROM avaliacao a
      LEFT JOIN modulo m ON a.modulo_id = m.id
      LEFT JOIN disciplina d ON a.disciplina_id = d.id
      LEFT JOIN professor p ON a.professor_id = p.id
      LEFT JOIN situacao_aval s ON a.situacao = s.situacao
      LEFT JOIN tipo_aval t ON a.tipo = t.tipo
      ${whereClause}
      ORDER BY a.data ASC, a.horario_ini ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const countQuery = `SELECT COUNT(*) AS total FROM avaliacao a LEFT JOIN modulo m ON a.modulo_id = m.id LEFT JOIN professor p ON a.professor_id = p.id ${whereClause}`;

    const listResult = await pool.query(listQuery, params);
    const countResult = await pool.query(countQuery, search ? [params[0]] : []);
    const avaliacoes = listResult.rows;
    const total = Number.parseInt(countResult.rows[0].total);

    for (const avaliacao of avaliacoes) {
      const labsResult = await pool.query(
        `SELECT lc.id, lc.nome FROM laboratorio_conjuntos lc JOIN avaliacao_laboratorio al ON lc.id = al.conjunto_id WHERE al.avaliacao_id = $1`,
        [avaliacao.id]
      );
      avaliacao.laboratorios = labsResult.rows;
    }

    return { avaliacoes, total };
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT a.*, m.nome AS modulo_nome, d.descricao AS disciplina_nome, p.nome AS professor_nome, s.situacao AS situacao_nome, t.tipo AS tipo_nome
       FROM avaliacao a
       LEFT JOIN modulo m ON a.modulo_id = m.id
       LEFT JOIN disciplina d ON a.disciplina_id = d.id
       LEFT JOIN professor p ON a.professor_id = p.id
       LEFT JOIN situacao_aval s ON a.situacao = s.situacao
       LEFT JOIN tipo_aval t ON a.tipo = t.tipo
       WHERE a.id = $1`,
      [id]
    );
    
    if (result.rows.length > 0) {
      result.rows[0].laboratorios = await this.fetchLaboratoriosForAvaliacao(id);
      return result.rows[0];
    }
    return null;
  }

  static async updateVisivel(id, visivel) {
    const result = await pool.query(
      `UPDATE avaliacao SET visivel = $1 WHERE id = $2 RETURNING *`,
      [visivel, id]
    );
    if (result.rows.length === 0) {
      throw new Error('Avaliação não encontrada');
    }
    return result.rows[0];
  }

  static async updateDeleteLogico(id, delete_logico) {
    const result = await pool.query(
      `UPDATE avaliacao SET delete_logico = $1 WHERE id = $2 RETURNING *`,
      [delete_logico, id]
    );
    if (result.rows.length === 0) {
      throw new Error('Avaliação não encontrada');
    }
    return result.rows[0];
  }

  static async findAvailableLaboratorios({ data, horario_ini, horario_fim, qtd_alunos, caip }) {
    console.log('Buscando laboratórios disponíveis com:', { data, horario_ini, horario_fim, qtd_alunos, caip });
    try {
      this.validateDataFormat(data);
      this.validateHorarioFormat(horario_ini, horario_fim);
      this.validateQtdAlunos(qtd_alunos);

      const result = await pool.query(`
        SELECT lc.id, lc.nome, lc.qtd_com_total, lc.qtd_sem_total
        FROM laboratorio_conjuntos lc
        WHERE ${caip ? 'lc.qtd_com_total >= $1' : 'lc.qtd_sem_total >= $1'}
        AND lc.id NOT IN (
          SELECT al.conjunto_id
          FROM avaliacao a
          JOIN avaliacao_laboratorio al ON a.id = al.avaliacao_id
          WHERE a.data = $2
          AND a.horario_ini IS NOT NULL
          AND a.horario_fim IS NOT NULL
          AND (
            (a.horario_ini <= $3 AND a.horario_fim >= $4) OR
            (a.horario_ini >= $4 AND a.horario_ini < $3) OR
            (a.horario_fim > $4 AND a.horario_fim <= $3)
          )
        )
      `, [qtd_alunos, data, horario_fim, horario_ini]);
      console.log('Laboratórios disponíveis encontrados:', result.rows);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar laboratórios disponíveis:', error.message, error.stack);
      throw error;
    }
  }

  // ===== MÉTODOS AUXILIARES DE LISTAGEM =====

  static async findAllProfessores() {
    console.log('Executando findAllProfessores');
    const result = await pool.query('SELECT id, nome FROM professor');
    console.log('Professores retornados:', result.rows);
    return result.rows;
  }

  static async findAllDisciplinas() {
    console.log('Executando findAllDisciplinas');
    const result = await pool.query('SELECT id, descricao AS nome FROM disciplina');
    console.log('Disciplinas retornadas:', result.rows);
    return result.rows;
  }

  static async findAllModulos() {
    console.log('Executando findAllModulos');
    const result = await pool.query('SELECT id, nome FROM modulo');
    console.log('Módulos retornados:', result.rows);
    return result.rows;
  }

  static async findAllSituacoes() {
    console.log('Executando findAllSituacoes');
    const result = await pool.query('SELECT id, situacao FROM situacao_aval');
    console.log('Situações retornadas:', result.rows);
    return result.rows;
  }

  static async findAllTipos() {
    console.log('Executando findAllTipos');
    const result = await pool.query('SELECT id, tipo FROM tipo_aval');
    console.log('Tipos retornados:', result.rows);
    return result.rows;
  }
}

module.exports = Avaliacao;