// services/notificationService.js
const pool = require('../../src/database/db');
const { getConfig } = require('./configService');
const messageQueue = require('./messageQueue');
const { formatDate } = require('../utils/formatters');
const { TECHNICIANS_GROUP, GROUP_MAPPING, NOTIFICATION_INTERVAL, STATUS_UPDATE_INTERVAL } = require('../config/constants');
const { updateCache } = require('./cacheService');
const { updateStatus } = require('./configService');

let notificationInterval = null;
let cacheInterval = null;
let statusInterval = null;

function buildNotificationMessage(notification) {
  const disciplina = notification.disciplina_nome || `Disciplina ${notification.disciplina_id}`;
  const data = formatDate(notification.data);

  switch (notification.tipo_alteracao) {
    case 'CREATE':
      return `Nova avaliação adicionada: ${disciplina} em ${data}. Consulte detalhes digitando 'menu'.`;
    case 'UPDATE':
      return `Avaliação ${notification.avaliacao_id} atualizada: ${disciplina} em ${data}. Consulte digitando 'menu'.`;
    case 'DELETE':
      return `Avaliação ${notification.avaliacao_id} cancelada. Consulte o menu para mais informações.`;
    default:
      return `Alteração na avaliação ${notification.avaliacao_id}. Consulte o menu para mais informações.`;
  }
}

function getTargetGroups(moduloId) {
  const targetGroups = [TECHNICIANS_GROUP];
  const groupId = GROUP_MAPPING[moduloId];

  if (groupId) {
    targetGroups.push(groupId);
  } else {
    console.warn(`Módulo ID ${moduloId} não mapeado. Enviando apenas para Técnicos.`);
  }

  return targetGroups;
}

async function sendNotifications() {
  const notificationsEnabled = await getConfig('notifications_enabled');
  if (notificationsEnabled !== '1') {
    console.log('Notificações desativadas via painel.');
    return;
  }

  try {
    const result = await pool.query(`
      SELECT n.*, a.disciplina_id, a.data, d.descricao AS disciplina_nome, a.modulo_id
      FROM notificacoes_avaliacao n
      LEFT JOIN avaliacao a ON n.avaliacao_id = a.id
      LEFT JOIN disciplina d ON a.disciplina_id = d.id
      WHERE n.enviada = false AND n.created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
        AND a.visivel = TRUE AND a.delete_logico = FALSE
    `);

    const notifications = result.rows;
    if (!notifications || notifications.length === 0) return;

    for (const notification of notifications) {
      const message = buildNotificationMessage(notification);
      const targetGroups = getTargetGroups(notification.modulo_id);

      for (const group of targetGroups) {
        await messageQueue.add({ chatId: group, message }, { delay: 1000 });
      }

      await pool.query(
        `UPDATE notificacoes_avaliacao SET enviada = true WHERE id = $1`,
        [notification.id]
      );
    }

    console.log(`Processadas ${notifications.length} notificações.`);
  } catch (error) {
    console.error('Erro ao enviar notificações:', error.message);
  }
}

function startNotificationRoutine() {
  // Limpa timers existentes antes de iniciar novos
  stopNotificationRoutine();

  notificationInterval = setInterval(sendNotifications, NOTIFICATION_INTERVAL);
  cacheInterval = setInterval(updateCache, 3600000);
  statusInterval = setInterval(updateStatus, STATUS_UPDATE_INTERVAL);

  // Envio imediato
  sendNotifications();
}

function stopNotificationRoutine() {
  if (notificationInterval) clearInterval(notificationInterval);
  if (cacheInterval) clearInterval(cacheInterval);
  if (statusInterval) clearInterval(statusInterval);

  notificationInterval = null;
  cacheInterval = null;
  statusInterval = null;
}

module.exports = {
  sendNotifications,
  startNotificationRoutine,
  stopNotificationRoutine,
};
