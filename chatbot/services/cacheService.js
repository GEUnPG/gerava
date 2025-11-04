// services/cacheService.js
const pool = require('../../src/database/db');

let lastCacheUpdate = 0;
const modulos = [];
const professores = [];

async function updateCache() {
  const now = Date.now();
  if (now - lastCacheUpdate < 3600000) return;

  try {
    const modulosResult = await pool.query('SELECT id, nome FROM modulo');
    const professoresResult = await pool.query('SELECT id, nome FROM professor');
    
    modulos.length = 0;
    professores.length = 0;
    
    modulos.push(...modulosResult.rows);
    professores.push(...professoresResult.rows);
    
    lastCacheUpdate = now;
    console.log('Cache atualizado: módulos e professores.');
  } catch (error) {
    console.error('Erro ao atualizar cache:', error.message);
  }
}

function getModulos() {
  return modulos;
}

function getProfessores() {
  return professores;
}

module.exports = {
  updateCache,
  getModulos,
  getProfessores,
};
