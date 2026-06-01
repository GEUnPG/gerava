// src/models/ConsultaModel.js
const pool = require('../database/db');

class Consulta {
  static async findAllPublic() {
    console.log('Executando findAllPublic em ConsultaModel');
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

      console.log('Avaliações públicas encontradas:', avaliacoes);
      return avaliacoes;
    } catch (error) {
      console.error('Erro ao buscar avaliações públicas:', error.message, error.stack);
      throw error;
    }
  }
}

module.exports = Consulta; //