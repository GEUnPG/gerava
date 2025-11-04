// handlers/menuHandler.js
const { getConfig } = require('../services/configService');
const messageQueue = require('../services/messageQueue');

async function showMainMenu(msg, name) {
  const menuEnabled = await getConfig('menu_enabled');
  if (menuEnabled !== '1') {
    console.log(`Menu desativado para ${msg.from}`);
    await messageQueue.add({ 
      chatId: msg.from, 
      message: 'O menu está desativado. Tente novamente mais tarde ou contate o suporte.' 
    });
    return;
  }

  const firstName = name.split(' ')[0];
  const menuMessage = `Olá, ${firstName}! Sou o assistente virtual do GerAva. Como posso ajudar hoje? Escolha uma opção:

1 - Consultar Avaliações por Módulo ou Período
2 - Consultar Avaliações por Data
3 - Consultar Avaliação por ID
4 - Consultar Avaliações por Professor

Digite "menu" a qualquer momento para voltar aqui.
Digite "parar" para não receber notificações ou "ativar" para recebê-las.`;

  await messageQueue.add({ chatId: msg.from, message: menuMessage });
}

module.exports = {
  showMainMenu,
};
