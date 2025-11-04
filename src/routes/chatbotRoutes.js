//refatorada 2025-11-04
// src/routes/chatbotRoutes.js
const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/ChatbotController');
const { isAuthenticated } = require('../middleware/auth');

console.log('✅ Carregando src/routes/chatbotRoutes.js');

// ===== HELPER PARA LOGS =====
function logRoute(method, path, body = null) {
  const logMsg = `📩 ${method} ${path}`;
  console.log(body ? `${logMsg} ${JSON.stringify(body)}` : logMsg);
}

// ===== ROTAS PROTEGIDAS =====

router.get('/config', isAuthenticated, (req, res, next) => {
  logRoute('GET', '/api/chatbot/config');
  ChatbotController.getConfig(req, res, next);
});

router.post('/config', isAuthenticated, (req, res, next) => {
  logRoute('POST', '/api/chatbot/config', req.body);
  ChatbotController.updateConfig(req, res, next);
});

router.get('/status', isAuthenticated, (req, res, next) => {
  logRoute('GET', '/api/chatbot/status');
  ChatbotController.getStatus(req, res, next);
});

router.get('/groups', isAuthenticated, (req, res, next) => {
  logRoute('GET', '/api/chatbot/groups');
  ChatbotController.getGroups(req, res, next);
});

router.post('/broadcast', isAuthenticated, (req, res, next) => {
  logRoute('POST', '/api/chatbot/broadcast', req.body);
  ChatbotController.sendBroadcast(req, res, next);
});

router.post('/stop', isAuthenticated, (req, res, next) => {
  logRoute('POST', '/api/chatbot/stop');
  ChatbotController.stopChatbot(req, res, next);
});

console.log('✅ Rotas definidas em chatbotRoutes');

module.exports = router;

