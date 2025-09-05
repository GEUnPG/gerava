const pool = require('../database/db');

class ModuloModel {
  static async getAll() {
    const result = await pool.query('SELECT id, nome FROM modulo ORDER BY id');
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT id, nome FROM modulo WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create({ nome }) {
    const result = await pool.query(
      'INSERT INTO modulo (nome) VALUES ($1) RETURNING id, nome',
      [nome]
    );
    return result.rows[0];
  }

  static async update(id, { nome }) {
    const result = await pool.query(
      'UPDATE modulo SET nome = $1 WHERE id = $2 RETURNING id, nome',
      [nome, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM modulo WHERE id = $1', [id]);
    return { message: 'Módulo excluído com sucesso' };
  }

  static async search(search) {
    const query = 'SELECT id, nome FROM modulo WHERE nome ILIKE $1 ORDER BY id';
    const result = await pool.query(query, [`%${search}%`]);
    return result.rows;
  }
}

module.exports = ModuloModel;