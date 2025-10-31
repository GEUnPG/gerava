const pool = require('../database/db');

class DisciplinaModel {
  static async getAll() {
    const result = await pool.query(`
      SELECT d.id, d.descricao, d.modulo_id, m.nome AS modulo_nome, d.professor_id, p.nome AS professor_nome
      FROM disciplina d
      LEFT JOIN modulo m ON d.modulo_id = m.id
      LEFT JOIN professor p ON d.professor_id = p.id
      ORDER BY d.id
    `);
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query(`
      SELECT d.id, d.descricao, d.modulo_id, m.nome AS modulo_nome, d.professor_id, p.nome AS professor_nome
      FROM disciplina d
      LEFT JOIN modulo m ON d.modulo_id = m.id
      LEFT JOIN professor p ON d.professor_id = p.id
      WHERE d.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async create({ descricao, modulo_id, professor_id }) {
    const result = await pool.query(`
      INSERT INTO disciplina (descricao, modulo_id, professor_id)
      VALUES ($1, $2, $3)
      RETURNING id, descricao, modulo_id, professor_id
    `, [descricao, modulo_id || null, professor_id || null]);
    return result.rows[0];
  }

  static async update(id, { descricao, modulo_id, professor_id }) {
    const result = await pool.query(`
      UPDATE disciplina
      SET descricao = $1, modulo_id = $2, professor_id = $3
      WHERE id = $4
      RETURNING id, descricao, modulo_id, professor_id
    `, [descricao, modulo_id || null, professor_id || null, id]);
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM disciplina WHERE id = $1', [id]);
    return { message: 'Disciplina excluída com sucesso' };
  }

  static async search(search) {
    const query = `
      SELECT d.id, d.descricao, d.modulo_id, m.nome AS modulo_nome, d.professor_id, p.nome AS professor_nome
      FROM disciplina d
      LEFT JOIN modulo m ON d.modulo_id = m.id
      LEFT JOIN professor p ON d.professor_id = p.id
      WHERE d.descricao ILIKE $1
      ORDER BY d.id
    `;
    const result = await pool.query(query, [`%${search}%`]);
    return result.rows;
  }

  static async getModulos() {
  try {
    console.log('Executando getModulos');
    const result = await pool.query('SELECT id, nome FROM modulo ORDER BY nome');
    console.log('Módulos retornados:', result.rows);
    return result.rows;
  } catch (error) {
    console.error('Erro ao executar getModulos:', error.message, error.stack);
    throw error;
  }
}


  static async getProfessores() {
  try {
    console.log('Executando getProfessores');
    const result = await pool.query('SELECT id, nome FROM professor ORDER BY nome');
    console.log('Professores retornados:', result.rows);
    return result.rows;
  } catch (error) {
    console.error('Erro ao executar getProfessores:', error.message, error.stack);
    throw error;
  }
}
  
}

module.exports = DisciplinaModel;
