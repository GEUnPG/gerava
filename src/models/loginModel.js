const pool = require('../database/db');
const bcrypt = require('bcrypt');

class LoginModel {
  static async getByUsername(username) {
    const result = await pool.query('SELECT id, username, password FROM login_secreto WHERE username = $1', [username]);
    return result.rows[0];
  }

  static async create({ username, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO login_secreto (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );
    return result.rows[0];
  }
}

module.exports = LoginModel;
