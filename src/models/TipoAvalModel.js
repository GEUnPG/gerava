const pool = require('../database/db');

class TipoAvalModel {
  static async getAll() {
    const result = await pool.query('SELECT id, tipo FROM tipo_aval ORDER BY id');
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT id, tipo FROM tipo_aval WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create({ tipo }) {
    const result = await pool.query(
      'INSERT INTO tipo_aval (tipo) VALUES ($1) RETURNING id, tipo',
      [tipo]
    );
    return result.rows[0];
  }

  static async update(id, { tipo }) {
    const result = await pool.query(
      'UPDATE tipo_aval SET tipo = $1 WHERE id = $2 RETURNING id, tipo',
      [tipo, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM tipo_aval WHERE id = $1', [id]);
    return { message: 'Tipo excluído com sucesso' };
  }

  static async search(search) {
    const query = 'SELECT id, tipo FROM tipo_aval WHERE tipo ILIKE $1 ORDER BY id';
    const result = await pool.query(query, [`%${search}%`]);
    return result.rows;
  }
}

module.exports = TipoAvalModel;