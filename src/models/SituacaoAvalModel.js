const pool = require('../database/db');

class SituacaoAvalModel {
  static async getAll() {
    const result = await pool.query('SELECT id, situacao FROM situacao_aval ORDER BY id');
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT id, situacao FROM situacao_aval WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create({ situacao }) {
    const result = await pool.query(
      'INSERT INTO situacao_aval (situacao) VALUES ($1) RETURNING id, situacao',
      [situacao]
    );
    return result.rows[0];
  }

  static async update(id, { situacao }) {
    const result = await pool.query(
      'UPDATE situacao_aval SET situacao = $1 WHERE id = $2 RETURNING id, situacao',
      [situacao, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM situacao_aval WHERE id = $1', [id]);
    return { message: 'Situação excluída com sucesso' };
  }

  static async search(search) {
    const query = 'SELECT id, situacao FROM situacao_aval WHERE situacao ILIKE $1 ORDER BY id';
    const result = await pool.query(query, [`%${search}%`]);
    return result.rows;
  }
}

module.exports = SituacaoAvalModel;