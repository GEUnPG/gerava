// src/controllers/ChatbotController.js - Refatorado
//refatorado 2025-11-04
const pool = require('../database/db');
const { sendBroadcastMessage, reloadConfig, stopChatbot } = require('../../chatbot/chatbot'); // ✅ Caminho atualizado
const { chatbotStatus } = require('../../chatbot/services/statusService'); // ✅ Import do status

// ===== HELPERS =====

function handleError(res, error, message = 'Erro interno do servidor.', statusCode = 500) {
  console.error(`Erro: ${message}`, error.message, error.stack);
  res.status(statusCode).json({ error: message });
}

async function queryConfig(settings) {
  try {
    const placeholders = settings.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(
      `SELECT setting, value FROM chatbot_config WHERE setting IN (${placeholders})`,
      settings
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao consultar configurações:', error.message);
    throw error;
  }
}

const VALID_SETTINGS = ['notifications_enabled', 'auto_replies_enabled', 'menu_enabled'];
const DEFAULT_CONFIGS = [
  { setting: 'notifications_enabled', value: '1' },
  { setting: 'auto_replies_enabled', value: '1' },
  { setting: 'menu_enabled', value: '1' },
];

// ===== CONTROLLER =====

const ChatbotController = {
  async getConfig(req, res) {
    try {
      const rows = await queryConfig(VALID_SETTINGS);
      
      const configs = DEFAULT_CONFIGS.map(defaultConfig => {
        const row = rows.find(r => r.setting === defaultConfig.setting);
        return row || defaultConfig;
      });
      
      console.log('Configurações retornadas:', configs);
      res.status(200).json(configs);
    } catch (error) {
      handleError(res, error, 'Erro ao obter configurações');
    }
  },

  async updateConfig(req, res) {
    const { setting, value } = req.body;
    console.log(`Recebido POST /api/chatbot/config: setting=${setting}, value=${value}`);

    // Validação de entrada
    if (!setting || value === undefined) {
      console.warn('Parâmetros inválidos:', { setting, value });
      return res.status(400).json({ error: 'Parâmetros setting e value são obrigatórios.' });
    }

    if (!VALID_SETTINGS.includes(setting)) {
      console.warn(`Configuração inválida: ${setting}`);
      return res.status(400).json({ error: 'Configuração inválida.' });
    }

    try {
      console.log(`Tentando atualizar configuração: setting=${setting}, value=${value}`);
      
      const result = await pool.query(
        'UPDATE chatbot_config SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE setting = $2 RETURNING *',
        [value, setting]
      );

      if (result.rowCount === 0) {
        console.log(`Configuração ${setting} não encontrada, inserindo nova.`);
        const insertResult = await pool.query(
          'INSERT INTO chatbot_config (setting, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING *',
          [setting, value]
        );
        console.log(`Configuração inserida:`, insertResult.rows[0]);
      } else {
        console.log(`Configuração atualizada:`, result.rows[0]);
      }

      console.log('Chamando reloadConfig...');
      await reloadConfig();
      
      res.status(200).json({ message: 'Configuração atualizada com sucesso.' });
    } catch (error) {
      handleError(res, error, `Erro ao atualizar configuração: ${error.message}`);
    }
  },

  async getStatus(req, res) {
    const status = {
      connected: chatbotStatus?.connected || false,
      messagesSentToday: chatbotStatus?.messagesSentToday || 0,
      messagesReceivedToday: chatbotStatus?.messagesReceivedToday || 0,
      subscribedUsers: 0,
    };

    try {
      const configRows = await queryConfig([
        'connection_status',
        'messages_sent_today',
        'messages_received_today',
      ]);

      const usersResult = await pool.query(
        'SELECT COUNT(*) AS count FROM chatbot_users WHERE subscribed = true'
      );
      
      status.subscribedUsers = Number.parseInt(usersResult.rows[0].count) || 0;

      for (const row of configRows) {
        if (row.setting === 'connection_status') {
          status.connected = row.value === '1';
        }
        if (row.setting === 'messages_sent_today') {
          status.messagesSentToday = Number.parseInt(row.value) || 0;
        }
        if (row.setting === 'messages_received_today') {
          status.messagesReceivedToday = Number.parseInt(row.value) || 0;
        }
      }

      res.status(200).json(status);
    } catch (error) {
      handleError(res, error, 'Erro ao obter status');
    }
  },

  async getGroups(req, res) {
    try {
      const groups = [
        { id: 'technicians', name: 'Técnicos', chatId: '120363401603739472@g.us' },
        { id: 'module6', name: 'Módulo 6', chatId: '120363417941205146@g.us' },
        { id: 'module7', name: 'Módulo 7', chatId: '120363419605122416@g.us' },
      ];
      res.status(200).json(groups);
    } catch (error) {
      handleError(res, error, 'Erro ao obter grupos');
    }
  },

  async sendBroadcast(req, res) {
    const { message, groups } = req.body;

    // Validação de entrada
    if (!message || !Array.isArray(groups) || groups.length === 0) {
      return res.status(400).json({ error: 'Mensagem e lista de grupos são obrigatórios.' });
    }

    // Validação de IDs de grupos
    const validGroups = ['technicians', 'module6', 'module7'];
    const invalidGroups = groups.filter(g => !validGroups.includes(g));
    
    if (invalidGroups.length > 0) {
      return res.status(400).json({ error: `Grupos inválidos: ${invalidGroups.join(', ')}.` });
    }

    try {
      await sendBroadcastMessage(message, groups);
      res.status(200).json({ message: 'Mensagem enviada com sucesso.' });
    } catch (error) {
      handleError(res, error, 'Erro ao enviar mensagem broadcast');
    }
  },

  async stopChatbot(req, res) {
    try {
      const result = await stopChatbot();
      res.status(200).json(result);
    } catch (error) {
      handleError(res, error, `Erro ao parar chatbot: ${error.message}`);
    }
  },
};

module.exports = ChatbotController;