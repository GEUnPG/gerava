// chatbot.js - Arquivo principal
const { initializeClient, stopClient, registerWebSocket } = require('./whatsapp/clientManager');
const { sendNotifications } = require('./services/notificationService');
const { reloadConfig } = require('./services/configService');
const messageQueue = require('./services/messageQueue');
const { chatbotStatus } = require('./services/statusService');
const { getConfig } = require('./services/configService');
const { GROUP_MAPPING, TECHNICIANS_GROUP } = require('./config/constants');

async function startChatbot() {
  try {
    const { client, alreadyConnected } = initializeClient();
    if (!alreadyConnected) {
      await client.initialize();
    }
    return { alreadyConnected };
  } catch (error) {
    console.error('Erro ao iniciar chatbot:', error.message);
    throw error;
  }
}

async function sendBroadcastMessage(message, groupIds = []) {
  if (!chatbotStatus.connected) {
    throw new Error('Chatbot não está conectado ao WhatsApp.');
  }

  const autoRepliesEnabled = await getConfig('auto_replies_enabled');
  if (autoRepliesEnabled !== '1') {
    console.log('Broadcast bloqueado: respostas automáticas desativadas.');
    throw new Error('Respostas automáticas desativadas.');
  }

  const groupChatIds = {
    technicians: TECHNICIANS_GROUP,
    module6: GROUP_MAPPING[1],
    module7: GROUP_MAPPING[2],
  };

  const normalized = groupIds.map(g => groupChatIds[g] || g).filter(Boolean);
  if (normalized.length === 0) {
    throw new Error('Nenhum grupo válido selecionado.');
  }

  for (const groupId of normalized) {
    await messageQueue.add({ chatId: groupId, message }, { delay: 1000 });
  }
}

async function sendMessage(chatId, message) {
  if (!chatbotStatus.connected) {
    throw new Error('Chatbot não está conectado ao WhatsApp.');
  }
  
  const autoRepliesEnabled = await getConfig('auto_replies_enabled');
  if (autoRepliesEnabled !== '1') {
    throw new Error('Respostas automáticas desativadas.');
  }
  
  await messageQueue.add({ chatId, message }, { delay: 1000 });
  console.log(`Mensagem enfileirada para ${chatId}`);
}

module.exports = {
  startChatbot,
  notifyChange: sendNotifications,
  sendBroadcastMessage,
  sendMessage,
  registerWebSocket,
  reloadConfig,
  stopChatbot: stopClient,
};
