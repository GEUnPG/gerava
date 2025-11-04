// services/configService.js
const pool = require('../../src/database/db');
const { CONFIG_CACHE_DURATION } = require('../config/constants');

let configCache = {
  notifications_enabled: '0',
  auto_replies_enabled: '0',
  menu_enabled: '0',
  lastUpdated: 0,
};

async function getConfig(setting) {
  const now = Date.now();
  
  if (now - configCache.lastUpdated < CONFIG_CACHE_DURATION) {
    if (!setting) return { ...configCache };
    return configCache[setting] || '0';
  }

  try {
    const result = await pool.query(
      'SELECT setting, value FROM chatbot_config WHERE setting IN ($1, $2, $3)',
      ['notifications_enabled', 'auto_replies_enabled', 'menu_enabled']
    );

    for (const row of result.rows) {
      configCache[row.setting] = row.value;
    }

    configCache.lastUpdated = now;
    console.log('Configurações atualizadas no cache:', configCache);
    
    if (!setting) return { ...configCache };
    return configCache[setting] || '0';
  } catch (error) {
    console.error('Erro ao obter configuração:', error.message);
    if (!setting) return { ...configCache };
    return configCache[setting] || '0';
  }
}

async function updateConfigInDB(setting, value) {
  try {
    await pool.query(
      `INSERT INTO chatbot_config (setting, value) VALUES ($1, $2)
       ON CONFLICT (setting) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [setting, value]
    );
  } catch (error) {
    console.error(`Erro ao atualizar ${setting}:`, error.message);
  }
}

async function updateStatus() {
  const { chatbotStatus } = require('./statusService');
  
  await Promise.all([
    updateConfigInDB('connection_status', chatbotStatus.connected ? '1' : '0'),
    updateConfigInDB('messages_sent_today', chatbotStatus.messagesSentToday.toString()),
    updateConfigInDB('messages_received_today', chatbotStatus.messagesReceivedToday.toString()),
  ]);
}

async function reloadConfig() {
  console.log('Recarregando configurações do chatbot...');
  configCache.lastUpdated = 0;
  await getConfig();
  
  const { sendNotifications } = require('./notificationService');
  await sendNotifications();
}

module.exports = {
  getConfig,
  updateConfigInDB,
  updateStatus,
  reloadConfig,
};
