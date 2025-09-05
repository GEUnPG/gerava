const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/ChatbotController');
const { isAuthenticated } = require('../middleware/auth');
const { stopChatbot } = require('../../chatbot'); // Importa stopChatbot

console.log('✅ Carregando src/routes/chatbotRoutes.js');

// Rotas protegidas
router.get('/config', isAuthenticated, (req, res, next) => {
  console.log('📩 Acessando GET /api/chatbot/config');
  ChatbotController.getConfig(req, res, next);
});

router.post('/config', isAuthenticated, (req, res, next) => {
  console.log('📩 Acessando POST /api/chatbot/config', req.body);
  ChatbotController.updateConfig(req, res, next);
});

router.get('/status', isAuthenticated, (req, res, next) => {
  console.log('📩 Acessando GET /api/chatbot/status');
  ChatbotController.getStatus(req, res, next);
});

router.get('/groups', isAuthenticated, (req, res, next) => {
  console.log('📩 Acessando GET /api/chatbot/groups');
  ChatbotController.getGroups(req, res, next);
});

router.post('/broadcast', isAuthenticated, (req, res, next) => {
  console.log('📩 Acessando POST /api/chatbot/broadcast', req.body);
  ChatbotController.sendBroadcast(req, res, next);
});

// Novo endpoint para parar o chatbot
router.post('/stop', isAuthenticated, async (req, res, next) => {
  console.log('📩 Acessando POST /api/chatbot/stop');
  try {
    const result = await stopChatbot();
    res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao parar chatbot:', error.message);
    res.status(500).json({ error: `Erro ao parar chatbot: ${error.message}` });
  }
});

console.log('✅ Rotas definidas em chatbotRoutes');

module.exports = router;

