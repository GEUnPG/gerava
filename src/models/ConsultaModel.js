// src/models/ConsultaModel.js
const pool = require('../database/db');

class Consulta {
  // Busca paginada
  static async findAllPublic(limit, offset) {
    console.log('Executando findAllPublic em ConsultaModel (paginado)');
    try {
      const query = `
        SELECT 
          a.*, 
          m.nome AS modulo_nome, 
          d.descricao AS disciplina_nome, 
          p.nome AS professor_nome, 
          s.situacao AS situacao_nome, 
          t.tipo AS tipo_nome
        FROM avaliacao a
        LEFT JOIN modulo m ON a.modulo_id = m.id
        LEFT JOIN disciplina d ON a.disciplina_id = d.id
        LEFT JOIN professor p ON a.professor_id = p.id
        LEFT JOIN situacao_aval s ON a.situacao = s.situacao
        LEFT JOIN tipo_aval t ON a.tipo = t.tipo
        WHERE a.visivel = TRUE AND a.delete_logico = FALSE
        ORDER BY a.data ASC, a.horario_ini ASC
        LIMIT $1 OFFSET $2
      `;

      const countQuery = `
        SELECT COUNT(*) AS total
        FROM avaliacao a
        WHERE a.visivel = TRUE AND a.delete_logico = FALSE
      `;

      const result = await pool.query(query, [limit, offset]);
      const avaliacoes = result.rows;

      // total para paginação
      const countResult = await pool.query(countQuery);
      const total = parseInt(countResult.rows[0].total, 10);

      // buscar laboratórios de cada avaliação
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

      return { avaliacoes, total };
    } catch (error) {
      console.error('Erro ao buscar avaliações públicas (paginado):', error.message, error.stack);
      throw error;
    }
  }

  // Busca sem paginação (usada na pesquisa avançada)
  static async findAllPublicNoPagination() {
    console.log('Executando findAllPublicNoPagination em ConsultaModel');
    try {
      const result = await pool.query(`
        SELECT 
          a.*, 
          m.nome AS modulo_nome, 
          d.descricao AS disciplina_nome, 
          p.nome AS professor_nome, 
          s.situacao AS situacao_nome, 
          t.tipo AS tipo_nome
        FROM avaliacao a
        LEFT JOIN modulo m ON a.modulo_id = m.id
        LEFT JOIN disciplina d ON a.disciplina_id = d.id
        LEFT JOIN professor p ON a.professor_id = p.id
        LEFT JOIN situacao_aval s ON a.situacao = s.situacao
        LEFT JOIN tipo_aval t ON a.tipo = t.tipo
        WHERE a.visivel = TRUE AND a.delete_logico = FALSE
        ORDER BY a.data ASC, a.horario_ini ASC
      `);

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

      return avaliacoes;
    } catch (error) {
      console.error('Erro ao buscar avaliações públicas (sem paginação):', error.message, error.stack);
      throw error;
    }
  }
}

module.exports = Consulta;
