const pool = require('../database/db');
const bcrypt = require('bcrypt');

class UsuariosModel {
  static async getAll() {
    const result = await pool.query('SELECT id, nome, username FROM usuarios ORDER BY id');
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT id, nome, username FROM usuarios WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create({ nome, username, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (nome, username, password) VALUES ($1, $2, $3) RETURNING id, nome, username',
      [nome, username, hashedPassword]
    );
    return result.rows[0];
  }

  static async update(id, { nome, username, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'UPDATE usuarios SET nome = $1, username = $2, password = $3 WHERE id = $4 RETURNING id, nome, username',
      [nome, username, hashedPassword, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    return { message: 'Usuário excluído com sucesso' };
  }

  static async getByUsername(username) {
    const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    return result.rows[0];
  }
}

module.exports = UsuariosModel;