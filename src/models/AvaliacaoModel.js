// src/models/AvaliacaoModel.js  rumando
const pool = require('../database/db');

class Avaliacao {
  // Verifica conflitos de horário e capacidade
  static async validateLaboratorios(data, avaliacaoId = null) {
    const { data: dataAvaliacao, horario_ini, horario_fim, qtd_alunos, caip, laboratorios } = data;

    if (!dataAvaliacao || !horario_ini || !horario_fim || !qtd_alunos || caip === undefined || !laboratorios || !Array.isArray(laboratorios)) {
      throw new Error('Dados incompletos para validação de laboratórios');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataAvaliacao)) {
      throw new Error('Data deve estar no formato yyyy-mm-dd');
    }
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(horario_ini) || !/^\d{2}:\d{2}(:\d{2})?$/.test(horario_fim)) {
      throw new Error('horario_ini e horario_fim devem estar no formato HH:MM ou HH:MM:SS');
    }
    if (!Number.isInteger(qtd_alunos) || qtd_alunos <= 0) {
      throw new Error('qtd_alunos deve ser um número inteiro positivo');
    }
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

  // Create
  static async create(inputData) {
    const { situacao, tipo, data, horario_ini, horario_fim, qtd_alunos, caip, modulo_id, disciplina_id, professor_id, qtd_objetiva, qtd_discursiva, laboratorios } = inputData;

    if (!situacao || !tipo || !data || !horario_ini || !horario_fim || !qtd_alunos || caip === undefined || !modulo_id || !disciplina_id || !professor_id) {
      throw new Error('Campos obrigatórios faltando para criar avaliação');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      throw new Error('Data deve estar no formato yyyy-mm-dd');
    }
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(horario_ini) || !/^\d{2}:\d{2}(:\d{2})?$/.test(horario_fim)) {
      throw new Error('horario_ini e horario_fim devem estar no formato HH:MM ou HH:MM:SS');
    }
    if (!Number.isInteger(qtd_alunos) || qtd_alunos <= 0) {
      throw new Error('qtd_alunos deve ser um número inteiro positivo');
    }
    if (!Number.isInteger(modulo_id) || !Number.isInteger(disciplina_id) || !Number.isInteger(professor_id)) {
      throw new Error('modulo_id, disciplina_id e professor_id devem ser números inteiros');
    }

    await this.validateLaboratorios(inputData);

    const result = await pool.query(
      `INSERT INTO avaliacao (situacao, tipo, data, horario_ini, horario_fim, qtd_alunos, caip, modulo_id, disciplina_id, professor_id, qtd_objetiva, qtd_discursiva, visivel, delete_logico)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE, FALSE)
       RETURNING id`,
      [situacao, tipo, data, horario_ini, horario_fim, qtd_alunos, caip, modulo_id, disciplina_id, professor_id, qtd_objetiva || null, qtd_discursiva || null]
    );
    const avaliacaoId = result.rows[0].id;

    if (laboratorios && laboratorios.length > 0) {
      for (const conjuntoId of laboratorios) {
        await pool.query('INSERT INTO avaliacao_laboratorio (avaliacao_id, conjunto_id) VALUES ($1, $2)', [avaliacaoId, conjuntoId]);
      }
    }

    await pool.query(
      `INSERT INTO notificacoes_avaliacao (avaliacao_id, tipo_alteracao) VALUES ($1, 'CREATE')`,
      [avaliacaoId]
    );

    return avaliacaoId;
  }

  // Update
  static async update(id, inputData) {
    const { situacao, tipo, data, horario_ini, horario_fim, qtd_alunos, caip, modulo_id, disciplina_id, professor_id, qtd_objetiva, qtd_discursiva, laboratorios } = inputData;

    if (!situacao || !tipo || !data || !horario_ini || !horario_fim || !qtd_alunos || caip === undefined || !modulo_id || !disciplina_id || !professor_id) {
      throw new Error('Campos obrigatórios faltando para atualizar avaliação');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      throw new Error('Data deve estar no formato yyyy-mm-dd');
    }
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(horario_ini) || !/^\d{2}:\d{2}(:\d{2})?$/.test(horario_fim)) {
      throw new Error('horario_ini e horario_fim devem estar no formato HH:MM ou HH:MM:SS');
    }
    if (!Number.isInteger(qtd_alunos) || qtd_alunos <= 0) {
      throw new Error('qtd_alunos deve ser um número inteiro positivo');
    }
    if (!Number.isInteger(modulo_id) || !Number.isInteger(disciplina_id) || !Number.isInteger(professor_id)) {
      throw new Error('modulo_id, disciplina_id e professor_id devem ser números inteiros');
    }

    await this.validateLaboratorios(inputData, id);

    await pool.query(
      `UPDATE avaliacao
       SET situacao = $1, tipo = $2, data = $3, horario_ini = $4, horario_fim = $5, qtd_alunos = $6, caip = $7, modulo_id = $8, disciplina_id = $9, professor_id = $10, qtd_objetiva = $11, qtd_discursiva = $12
       WHERE id = $13`,
      [situacao, tipo, data, horario_ini, horario_fim, qtd_alunos, caip, modulo_id, disciplina_id, professor_id, qtd_objetiva || null, qtd_discursiva || null, id]
    );

    await pool.query('DELETE FROM avaliacao_laboratorio WHERE avaliacao_id = $1', [id]);
    if (laboratorios && laboratorios.length > 0) {
      for (const conjuntoId of laboratorios) {
        await pool.query('INSERT INTO avaliacao_laboratorio (avaliacao_id, conjunto_id) VALUES ($1, $2)', [id, conjuntoId]);
      }
    }

    await pool.query(
      `INSERT INTO notificacoes_avaliacao (avaliacao_id, tipo_alteracao) VALUES ($1, 'UPDATE')`,
      [id]
    );
  }

  // Delete
  static async delete(id) {
    await pool.query(
      `INSERT INTO notificacoes_avaliacao (avaliacao_id, tipo_alteracao) VALUES ($1, 'DELETE')`,
      [id]
    );

    await pool.query('DELETE FROM avaliacao_laboratorio WHERE avaliacao_id = $1', [id]);
    await pool.query('DELETE FROM avaliacao WHERE id = $1', [id]);
  }

  // Read (Listar todas)
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

    for (let avaliacao of avaliacoes) {
      const labsResult = await pool.query(
        `SELECT lc.id, lc.nome, lc.qtd_com_total, lc.qtd_sem_total
         FROM laboratorio_conjuntos lc
         JOIN avaliacao_laboratorio al ON lc.id = al.conjunto_id
         WHERE al.avaliacao_id = $1`,
        [avaliacao.id]
      );
      avaliacao.laboratorios = labsResult.rows;
    }
    console.log('Avaliações encontradas:', avaliacoes.length);
    return avaliacoes;
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error.message, error.stack);
    throw new Error(`Erro na consulta ao banco de dados: ${error.message}`);
  }
}

// buscar todas paginadas
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
  
  // Executando as queries
  const listResult = await pool.query(listQuery, params);
  const countResult = await pool.query(countQuery, search ? [params[0]] : []);
  const avaliacoes = listResult.rows;
  const total = parseInt(countResult.rows[0].total);

  // Opcional: carregar laboratórios das avaliações (pelo id)
  for (let avaliacao of avaliacoes) {
    const labsResult = await pool.query(
      `SELECT lc.id, lc.nome FROM laboratorio_conjuntos lc JOIN avaliacao_laboratorio al ON lc.id = al.conjunto_id WHERE al.avaliacao_id = $1`,
      [avaliacao.id]
    );
    avaliacao.laboratorios = labsResult.rows;
  }

  return { avaliacoes, total };
}


  // Read (Buscar por ID)
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
      const labsResult = await pool.query(
        `SELECT lc.id, lc.nome, lc.qtd_com_total, lc.qtd_sem_total
         FROM laboratorio_conjuntos lc
         JOIN avaliacao_laboratorio al ON lc.id = al.conjunto_id
         WHERE al.avaliacao_id = $1`,
        [id]
      );
      result.rows[0].laboratorios = labsResult.rows;
      return result.rows[0];
    }
    return null;
  }

  // Atualizar visibilidade
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

  // Atualizar deleção lógica
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

  // Buscar laboratórios disponíveis
  static async findAvailableLaboratorios({ data, horario_ini, horario_fim, qtd_alunos, caip }) {
    console.log('Buscando laboratórios disponíveis com:', { data, horario_ini, horario_fim, qtd_alunos, caip });
    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        throw new Error('Data deve estar no formato yyyy-mm-dd');
      }
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(horario_ini) || !/^\d{2}:\d{2}(:\d{2})?$/.test(horario_fim)) {
        throw new Error('horario_ini e horario_fim devem estar no formato HH:MM ou HH:MM:SS');
      }
      if (!Number.isInteger(qtd_alunos) || qtd_alunos <= 0) {
        throw new Error('qtd_alunos deve ser um número inteiro positivo');
      }

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

  // Buscar todos os professores
  static async findAllProfessores() {
    console.log('Executando findAllProfessores');
    const result = await pool.query('SELECT id, nome FROM professor');
    console.log('Professores retornados:', result.rows);
    return result.rows;
  }

  // Buscar todas as disciplinas
  static async findAllDisciplinas() {
    console.log('Executando findAllDisciplinas');
    const result = await pool.query('SELECT id, descricao AS nome FROM disciplina');
    console.log('Disciplinas retornadas:', result.rows);
    return result.rows;
  }

  // Buscar todos os módulos
  static async findAllModulos() {
    console.log('Executando findAllModulos');
    const result = await pool.query('SELECT id, nome FROM modulo');
    console.log('Módulos retornados:', result.rows);
    return result.rows;
  }

  // Buscar todas as situações de avaliação
  static async findAllSituacoes() {
    console.log('Executando findAllSituacoes');
    const result = await pool.query('SELECT id, situacao FROM situacao_aval');
    console.log('Situações retornadas:', result.rows);
    return result.rows;
  }

  // Buscar todos os tipos de avaliação
  static async findAllTipos() {
    console.log('Executando findAllTipos');
    const result = await pool.query('SELECT id, tipo FROM tipo_aval');
    console.log('Tipos retornados:', result.rows);
    return result.rows;
  }
}

module.exports = Avaliacao;