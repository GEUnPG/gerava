// database/queries.js
const pool = require('../../src/database/db');
const { formatAvaliacoes } = require('../utils/formatters');

const AVALIACAO_BASE_QUERY = `
  SELECT a.data, a.horario_ini, a.horario_fim, 
         STRING_AGG(lc.nome, ', ') as laboratorios, 
         d.descricao as disciplina_nome
  FROM avaliacao a
  LEFT JOIN avaliacao_laboratorio al ON a.id = al.avaliacao_id
  LEFT JOIN laboratorio_conjuntos lc ON al.conjunto_id = lc.id
  LEFT JOIN disciplina d ON a.disciplina_id = d.id
  WHERE a.visivel = TRUE AND a.delete_logico = FALSE
`;

async function queryAvaliacoesByField(field, value) {
  try {
    const query = `
      ${AVALIACAO_BASE_QUERY}
      AND a.${field} = $1
      GROUP BY a.id, a.data, a.horario_ini, a.horario_fim, d.descricao
      ORDER BY a.data ASC, a.horario_ini ASC
    `;
    const result = await pool.query(query, [value]);
    return formatAvaliacoes(result.rows);
  } catch (error) {
    console.error(`Erro ao consultar avaliações por ${field}:`, error.message);
    return 'Erro ao consultar avaliações. Tente novamente mais tarde ou digite "menu" para voltar.';
  }
}

async function addOrUpdateUser(phoneNumber) {
  try {
    await pool.query(
      `INSERT INTO chatbot_users (phone_number, subscribed) VALUES ($1, true)
       ON CONFLICT (phone_number) DO UPDATE SET subscribed = true`,
      [phoneNumber]
    );
    console.log(`Usuário ${phoneNumber} adicionado/atualizado.`);
  } catch (error) {
    console.error('Erro ao adicionar/atualizar usuário:', error.message);
  }
}

async function manageSubscription(phoneNumber, subscribe) {
  try {
    await pool.query(
      `INSERT INTO chatbot_users (phone_number, subscribed) VALUES ($1, $2)
       ON CONFLICT (phone_number) DO UPDATE SET subscribed = $2`,
      [phoneNumber, subscribe]
    );
    console.log(`Assinatura de ${phoneNumber}: ${subscribe ? 'ativada' : 'desativada'}.`);
    return `Notificações ${subscribe ? 'ativadas' : 'desativadas'}. Digite "${subscribe ? 'parar' : 'ativar'}" para ${subscribe ? 'desativar' : 'reativar'}.`;
  } catch (error) {
    console.error('Erro ao gerenciar assinatura:', error.message);
    return 'Erro ao gerenciar notificações. Tente novamente mais tarde.';
  }
}

module.exports = {
  queryAvaliacoesByField,
  addOrUpdateUser,
  manageSubscription,
};
