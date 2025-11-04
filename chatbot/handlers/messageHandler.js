// handlers/messageHandler.js
const { getConfig } = require('../services/configService');
const { chatbotStatus } = require('../services/statusService');
const { updateStatus } = require('../services/configService');
const { addOrUpdateUser, manageSubscription } = require('../database/queries');
const messageQueue = require('../services/messageQueue');
const { processUserState, getUserState, initializeUserState } = require('./stateHandler');
const { showMainMenu } = require('./menuHandler');

async function handleIncomingMessage(msg) {
  if (!msg.from.endsWith('@c.us')) return;

  chatbotStatus.messagesReceivedToday++;
  if (chatbotStatus.messagesReceivedToday % 100 === 0) {
    await updateStatus();
  }

  const autoRepliesEnabled = await getConfig('auto_replies_enabled');
  if (autoRepliesEnabled !== '1') {
    console.log(`Respostas automáticas desativadas para ${msg.from}`);
    return;
  }

  const chat = await msg.getChat();
  const contact = await msg.getContact();
  const name = (contact && contact.pushname) ? contact.pushname : 'Aluno';
  const userId = msg.from;

  await addOrUpdateUser(userId);
  initializeUserState(userId);

  const userState = getUserState(userId);
  const body = (msg.body || '').trim();

  // Comandos de assinatura
  if (body.toLowerCase() === 'parar') {
    const response = await manageSubscription(userId, false);
    await messageQueue.add({ chatId: msg.from, message: response });
    userState.state = 'IDLE';
    return;
  }

  if (body.toLowerCase() === 'ativar') {
    const response = await manageSubscription(userId, true);
    await messageQueue.add({ chatId: msg.from, message: response });
    userState.state = 'IDLE';
    return;
  }

  // Comando de menu
  if (body.toLowerCase() === 'menu') {
    userState.state = 'IDLE';
    await showMainMenu(msg, name);
    return;
  }

  // Verificar opções de menu
  const menuEnabled = await getConfig('menu_enabled');
  if (menuEnabled !== '1' && ['1', '2', '3', '4'].includes(body)) {
    await messageQueue.add({ 
      chatId: msg.from, 
      message: 'Consultas por menu estão desativadas. Digite "menu" para voltar.' 
    });
    return;
  }

  // Processar estado do usuário
  await processUserState(msg, userState, body, chat, name);
}

module.exports = {
  handleIncomingMessage,
};
