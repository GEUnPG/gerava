// handlers/stateHandler.js
const { USER_STATES } = require('../config/constants');
const { getModulos, getProfessores, updateCache } = require('../services/cacheService');
const { queryAvaliacoesByField } = require('../database/queries');
const { isValidDate, isValidNumber } = require('../utils/validators');
const messageQueue = require('../services/messageQueue');
const { showMainMenu } = require('./menuHandler');

const userStates = {};

function initializeUserState(userId) {
  if (!userStates[userId]) {
    userStates[userId] = { state: USER_STATES.IDLE };
  }
}

function getUserState(userId) {
  return userStates[userId];
}

async function handleIdleState(msg, userState, body, chat, name) {
  // Saudação
  if (body.match(/^(oi|ol[áa]|ola|hello)\b/i)) {
    await showMainMenu(msg, name);
    return;
  }

  const option = body;
  if (!['1', '2', '3', '4'].includes(option)) {
    await messageQueue.add({ 
      chatId: msg.from, 
      message: 'Opção inválida. Digite 1, 2, 3 ou 4, ou "menu" para ver as opções.' 
    });
    return;
  }

  await chat.sendStateTyping();
  await new Promise(res => setTimeout(res, 2000));

  switch (option) {
    case '1':
      await handleModuloOption(msg, userState);
      break;
    case '2':
      await messageQueue.add({ 
        chatId: msg.from, 
        message: 'Por favor, informe a data no formato dd-mm-aaaa (ex.: 25-02-2025).' 
      });
      userState.state = USER_STATES.AWAITING_DATE;
      break;
    case '3':
      await messageQueue.add({ 
        chatId: msg.from, 
        message: 'Por favor, informe o ID da avaliação (ex.: 123).' 
      });
      userState.state = USER_STATES.AWAITING_AVALIACAO_ID;
      break;
    case '4':
      await handleProfessorOption(msg, userState);
      break;
  }
}

async function handleModuloOption(msg, userState) {
  try {
    await updateCache();
    const modulos = getModulos();

    if (modulos.length === 0) {
      await messageQueue.add({ 
        chatId: msg.from, 
        message: 'Nenhum módulo encontrado. Tente novamente mais tarde ou digite "menu" para voltar.' 
      });
      userState.state = USER_STATES.IDLE;
      return;
    }

    let response = 'Escolha um módulo (digite o número):\n\n';
    for (const mod of modulos) {
      response += `${mod.id} - ${mod.nome}\n`;
    }

    await messageQueue.add({ chatId: msg.from, message: response });
    userState.state = USER_STATES.AWAITING_MODULO_ID;
  } catch (error) {
    console.error('Erro ao listar módulos:', error.message);
    await messageQueue.add({ 
      chatId: msg.from, 
      message: 'Erro ao listar módulos. Tente novamente mais tarde ou digite "menu" para voltar.' 
    });
    userState.state = USER_STATES.IDLE;
  }
}

async function handleProfessorOption(msg, userState) {
  try {
    await updateCache();
    const professores = getProfessores();

    if (professores.length === 0) {
      await messageQueue.add({ 
        chatId: msg.from, 
        message: 'Nenhum professor encontrado. Tente novamente mais tarde ou digite "menu" para voltar.' 
      });
      userState.state = USER_STATES.IDLE;
      return;
    }

    let response = 'Escolha um professor (digite o número):\n\n';
    for (const prof of professores) {
      response += `${prof.id} - ${prof.nome}\n`;
    }

    await messageQueue.add({ chatId: msg.from, message: response });
    userState.state = USER_STATES.AWAITING_PROFESSOR_ID;
  } catch (error) {
    console.error('Erro ao listar professores:', error.message);
    await messageQueue.add({ 
      chatId: msg.from, 
      message: 'Erro ao listar professores. Tente novamente mais tarde ou digite "menu" para voltar.' 
    });
    userState.state = USER_STATES.IDLE;
  }
}

async function handleAwaitingModuloId(msg, userState, body) {
  if (!isValidNumber(body)) {
    await messageQueue.add({ 
      chatId: msg.from, 
      message: 'Por favor, digite um número válido para o módulo ou "menu" para voltar.' 
    });
    return;
  }

  const moduloId = Number.parseInt(body);
  const response = await queryAvaliacoesByField('modulo_id', moduloId);
  await messageQueue.add({ chatId: msg.from, message: response });
  userState.state = USER_STATES.IDLE;
}

async function handleAwaitingDate(msg, userState, body) {
  const dateStr = body;
  if (!isValidDate(dateStr)) {
    await messageQueue.add({ 
      chatId: msg.from, 
      message: 'Formato de data inválido. Use dd-mm-aaaa (ex.: 25-02-2025) ou digite "menu" para voltar.' 
    });
    return;
  }

  const [day, month, year] = dateStr.split('-');
  const dbDate = `${year}-${month}-${day}`;
  const response = await queryAvaliacoesByField('data', dbDate);
  await messageQueue.add({ chatId: msg.from, message: response });
  userState.state = USER_STATES.IDLE;
}

async function handleAwaitingAvaliacaoId(msg, userState, body) {
  if (!isValidNumber(body)) {
    await messageQueue.add({ 
      chatId: msg.from, 
      message: 'Por favor, digite um número válido para o ID da avaliação ou "menu" para voltar.' 
    });
    return;
  }

  const avaliacaoId = Number.parseInt(body);
  const response = await queryAvaliacoesByField('id', avaliacaoId);
  await messageQueue.add({ chatId: msg.from, message: response });
  userState.state = USER_STATES.IDLE;
}

async function handleAwaitingProfessorId(msg, userState, body) {
  if (!isValidNumber(body)) {
    await messageQueue.add({ 
      chatId: msg.from, 
      message: 'Por favor, digite um número válido para o professor ou "menu" para voltar.' 
    });
    return;
  }

  const professorId = Number.parseInt(body);
  const response = await queryAvaliacoesByField('professor_id', professorId);
  await messageQueue.add({ chatId: msg.from, message: response });
  userState.state = USER_STATES.IDLE;
}

async function processUserState(msg, userState, body, chat, name) {
  switch (userState.state) {
    case USER_STATES.IDLE:
      await handleIdleState(msg, userState, body, chat, name);
      break;
    case USER_STATES.AWAITING_MODULO_ID:
      await handleAwaitingModuloId(msg, userState, body);
      break;
    case USER_STATES.AWAITING_DATE:
      await handleAwaitingDate(msg, userState, body);
      break;
    case USER_STATES.AWAITING_AVALIACAO_ID:
      await handleAwaitingAvaliacaoId(msg, userState, body);
      break;
    case USER_STATES.AWAITING_PROFESSOR_ID:
      await handleAwaitingProfessorId(msg, userState, body);
      break;
    default:
      console.warn(`Estado desconhecido: ${userState.state}`);
      userState.state = USER_STATES.IDLE;
      await showMainMenu(msg, name);
      break;
  }
}

module.exports = {
  initializeUserState,
  getUserState,
  processUserState,
};

