const pool = require('../database/db');

class ProfessorModel {
  // Criar professor
  static async create(nome) {
    try {
      const result = await pool.query(
        'INSERT INTO professor (nome) VALUES ($1) RETURNING *',
        [nome]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao criar professor: ${error.message}`);
    }
  }

  // Obter todos os professores
  static async findAll(search = '') {
    try {
      const query = search
        ? 'SELECT * FROM professor WHERE nome ILIKE $1 ORDER BY nome'
        : 'SELECT * FROM professor ORDER BY nome';
      const params = search ? [`%${search}%`] : [];
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Erro ao listar professores: ${error.message}`);
    }
  }

  // Obter professor por ID
  static async findById(id) {
    try {
      const result = await pool.query('SELECT * FROM professor WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        throw new Error('Professor não encontrado');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao obter professor: ${error.message}`);
    }
  }

  // Atualizar professor
  static async update(id, nome) {
    try {
      const result = await pool.query(
        'UPDATE professor SET nome = $1 WHERE id = $2 RETURNING *',
        [nome, id]
      );
      if (result.rows.length === 0) {
        throw new Error('Professor não encontrado');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao atualizar professor: ${error.message}`);
    }
  }

  // Deletar professor
  static async delete(id) {
    try {
      const result = await pool.query('DELETE FROM professor WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        throw new Error('Professor não encontrado');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erro ao excluir professor: ${error.message}`);
    }
  }
}

module.exports = ProfessorModel;