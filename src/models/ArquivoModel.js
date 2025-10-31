const pool = require('../database/db');

class Arquivo {
  static async findAllDeleted() {
    console.log('Executando findAllDeleted em ArquivoModel');
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
        WHERE a.delete_logico = TRUE
        ORDER BY a.data ASC, a.horario_ini ASC
      `);
      console.log('Consulta principal executada, linhas retornadas:', result.rows.length);
      const avaliacoes = result.rows;

      for (let avaliacao of avaliacoes) {
        console.log(`Buscando laboratórios para avaliação ID ${avaliacao.id}`);
        const labsResult = await pool.query(
          `SELECT lc.id, lc.nome, lc.qtd_com_total, lc.qtd_sem_total
           FROM laboratorio_conjuntos lc
           JOIN avaliacao_laboratorio al ON lc.id = al.conjunto_id
           WHERE al.avaliacao_id = $1`,
          [avaliacao.id]
        );
        avaliacao.laboratorios = labsResult.rows;
        console.log(`Laboratórios encontrados para ID ${avaliacao.id}:`, labsResult.rows);
      }

      console.log('Avaliações arquivadas encontradas:', avaliacoes.length);
      return avaliacoes;
    } catch (error) {
      console.error('Erro ao buscar avaliações arquivadas:', error.message, error.stack);
      throw new Error(`Erro na consulta ao banco de dados: ${error.message}`);
    }
  }

  static async restore(id) {
    console.log(`Iniciando restauração da avaliação ID ${id}`);
    try {
      const result = await pool.query(
        `UPDATE avaliacao SET delete_logico = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND delete_logico = TRUE RETURNING id`,
        [id]
      );
      if (result.rowCount === 0) {
        throw new Error('Avaliação não encontrada ou já restaurada.');
      }
      console.log(`Avaliação ID ${id} restaurada com sucesso.`);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao restaurar avaliação:', error.message, error.stack);
      throw error;
    }
  }

  static async deletePermanently(id) {
    console.log(`Iniciando exclusão permanente da avaliação ID ${id}`);
    try {
      await pool.query('BEGIN');
      const labResult = await pool.query('DELETE FROM avaliacao_laboratorio WHERE avaliacao_id = $1', [id]);
      console.log(`Excluídas ${labResult.rowCount} relações em avaliacao_laboratorio para ID ${id}`);
      const avalResult = await pool.query('DELETE FROM avaliacao WHERE id = $1 AND delete_logico = TRUE RETURNING id', [id]);
      if (avalResult.rowCount === 0) {
        throw new Error('Avaliação não encontrada ou não está arquivada.');
      }
      await pool.query('COMMIT');
      console.log(`Avaliação ID ${id} excluída permanentemente.`);
      return avalResult.rows[0];
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Erro ao excluir avaliação permanentemente:', error.message, error.stack);
      throw error;
    }
  }
}

module.exports = Arquivo;
