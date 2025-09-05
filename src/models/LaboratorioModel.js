const pool = require('../database/db');

class Laboratorio {
  static async create({ nome, qtd_com_total, qtd_sem_total }) {
    try {
      console.log('Executando create conjunto:', { nome, qtd_com_total, qtd_sem_total });
      if (!nome || qtd_com_total < 0 || qtd_sem_total < 0) {
        throw new Error('Campos nome, qtd_com_total e qtd_sem_total são obrigatórios e devem ser válidos');
      }
      const result = await pool.query(
        'INSERT INTO laboratorio_conjuntos (nome, qtd_com_total, qtd_sem_total) VALUES ($1, $2, $3) RETURNING id',
        [nome, qtd_com_total, qtd_sem_total]
      );
      console.log('Conjunto criado, ID:', result.rows[0].id);
      return result.rows[0].id;
    } catch (error) {
      console.error('Erro ao criar conjunto:', error.message, error.stack);
      throw error;
    }
  }

  static async findAll(search = '') {
    try {
      console.log('Executando findAll conjuntos, busca:', search);
      const query = search
        ? 'SELECT * FROM laboratorio_conjuntos WHERE nome ILIKE $1 ORDER BY nome'
        : 'SELECT * FROM laboratorio_conjuntos ORDER BY nome';
      const result = await pool.query(query, search ? [`%${search}%`] : []);
      console.log('Conjuntos retornados:', result.rows);
      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar conjuntos:', error.message, error.stack);
      throw error;
    }
  }

  static async findById(id) {
    try {
      console.log('Executando findById conjunto:', id);
      const result = await pool.query('SELECT * FROM laboratorio_conjuntos WHERE id = $1', [id]);
      console.log('Conjunto retornado:', result.rows[0]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar conjunto por ID:', error.message, error.stack);
      throw error;
    }
  }

  static async update(id, { nome, qtd_com_total, qtd_sem_total }) {
    try {
      console.log('Executando update conjunto:', { id, nome, qtd_com_total, qtd_sem_total });
      if (!nome || qtd_com_total < 0 || qtd_sem_total < 0) {
        throw new Error('Campos nome, qtd_com_total e qtd_sem_total são obrigatórios e devem ser válidos');
      }
      const result = await pool.query(
        'UPDATE laboratorio_conjuntos SET nome = $1, qtd_com_total = $2, qtd_sem_total = $3 WHERE id = $4 RETURNING *',
        [nome, qtd_com_total, qtd_sem_total, id]
      );
      console.log('Conjunto atualizado:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar conjunto:', error.message, error.stack);
      throw error;
    }
  }

  static async delete(id) {
    try {
      console.log('Executando delete conjunto:', id);
      await pool.query('DELETE FROM laboratorio_conjuntos WHERE id = $1', [id]);
      console.log('Conjunto deletado:', id);
    } catch (error) {
      console.error('Erro ao deletar conjunto:', error.message, error.stack);
      throw error;
    }
  }
}

module.exports = Laboratorio;