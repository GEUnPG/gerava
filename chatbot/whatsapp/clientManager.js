// whatsapp/clientManager.js
const { Client } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const { updateStatus } = require('../services/configService');
const { updateCache } = require('../services/cacheService');
const { getConfig } = require('../services/configService');
const { chatbotStatus } = require('../services/statusService');
const messageQueue = require('../services/messageQueue');

let client = null;
let wsClients = new Set();

function broadcastToWebSockets(message) {
  for (const ws of wsClients) {
    if (ws.isOpen) {
      ws.send(JSON.stringify(message));
    }
  }
}

function initializeClient() {
  if (client && chatbotStatus.connected) {
    return { client, alreadyConnected: true };
  }

  client = new Client({
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  setupClientEvents();

  return { client, alreadyConnected: false };
}

function setupClientEvents() {
  client.on('qr', handleQREvent);
  client.on('auth_failure', handleAuthFailure);
  client.on('ready', handleReady);
  client.on('disconnected', handleDisconnected);
  
  const { handleIncomingMessage } = require('../handlers/messageHandler');
  client.on('message', handleIncomingMessage);
}

async function handleQREvent(qr) {
  try {
    const qrDataUrl = await QRCode.toDataURL(qr);
    broadcastToWebSockets({ type: 'qr', data: qrDataUrl });
    console.log('QR code gerado e enviado via WebSocket.');
  } catch (error) {
    console.error('Erro ao gerar QR code:', error.message);
    broadcastToWebSockets({ type: 'error', message: 'Erro ao gerar QR code.' });
  }
}

function handleAuthFailure(msg) {
  console.error('Falha de autenticação:', msg);
  chatbotStatus.connected = false;
  broadcastToWebSockets({ type: 'error', message: 'Falha de autenticação. Refaça o login via QR.' });
}

async function handleReady() {
  try {
    console.log('WhatsApp conectado!');
    chatbotStatus.connected = true;
    await updateStatus();
    await updateCache();
    await getConfig();
    
    const { startNotificationRoutine } = require('../services/notificationService');
    startNotificationRoutine();
    
    messageQueue.process();
    broadcastToWebSockets({ type: 'connected', message: 'Chatbot conectado!' });
    
    const chats = await client.getChats();
    const groups = chats.filter(c => c.isGroup).map(c => ({ id: c.id._serialized, name: c.name }));
    console.log('Grupos encontrados:', groups);
  } catch (err) {
    console.error('Erro no evento ready:', err.message);
  }
}

async function handleDisconnected(reason) {
  console.log('Cliente desconectado:', reason);
  chatbotStatus.connected = false;
  await updateStatus();
  client = null;
  broadcastToWebSockets({ type: 'disconnected', message: 'Chatbot desconectado.' });
}

function getClient() {
  return client;
}

function registerWebSocket(ws) {
  ws.isOpen = true;
  wsClients.add(ws);
  
  ws.on('close', () => {
    ws.isOpen = false;
    wsClients.delete(ws);
  });
  
  ws.send(JSON.stringify({
    type: 'status',
    connected: chatbotStatus.connected,
    message: chatbotStatus.connected ? 'Chatbot já conectado.' : 'Chatbot desconectado.',
  }));
}

async function stopClient() {
  console.log('Parando o chatbot...');
  
  if (client && chatbotStatus.connected) {
    await client.destroy();
    client = null;
    chatbotStatus.connected = false;
    await updateStatus();
    
    const { stopNotificationRoutine } = require('../services/notificationService');
    stopNotificationRoutine();
    
    broadcastToWebSockets({ type: 'disconnected', message: 'Chatbot parado com sucesso.' });
    console.log('Chatbot parado com sucesso.');
    return { message: 'Chatbot parado com sucesso.' };
  }
  
  return { message: 'Chatbot já está desconectado.' };
}

module.exports = {
  initializeClient,
  getClient,
  registerWebSocket,
  stopClient,
};
