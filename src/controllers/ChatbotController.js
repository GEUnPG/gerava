const pool = require('../database/db');
const { sendBroadcastMessage, reloadConfig } = require('../../chatbot'); // Adiciona reloadConfig

const ChatbotController = {
  getConfig: async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT setting, value FROM chatbot_config WHERE setting IN ($1, $2, $3)',
        ['notifications_enabled', 'auto_replies_enabled', 'menu_enabled']
      );
      const defaults = [
        { setting: 'notifications_enabled', value: '1' },
        { setting: 'auto_replies_enabled', value: '1' },
        { setting: 'menu_enabled', value: '1' }
      ];
      const configs = defaults.map(defaultConfig => {
        const row = result.rows.find(r => r.setting === defaultConfig.setting);
        return row || defaultConfig;
      });
      console.log('Configurações retornadas:', configs);
      res.status(200).json(configs);
    } catch (error) {
      console.error('Erro ao obter configurações:', error.message, error.stack);
      res.status(500).json({ error: 'Erro interno do servidor.' });
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
  if (!['notifications_enabled', 'auto_replies_enabled', 'menu_enabled'].includes(setting)) {
    console.warn(`Configuração inválida: ${setting}`);
    return res.status(400).json({ error: 'Configuração inválida.' });
  }
  // Usar o valor diretamente, já que é '0' ou '1'
  const stringValue = value; // Não precisa de conversão booleana
  try {
    console.log(`Tentando atualizar configuração: setting=${setting}, value=${stringValue}`);
    const result = await pool.query(
      'UPDATE chatbot_config SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE setting = $2 RETURNING *',
      [stringValue, setting]
    );
    if (result.rowCount === 0) {
      console.log(`Configuração ${setting} não encontrada, inserindo nova.`);
      const insertResult = await pool.query(
        'INSERT INTO chatbot_config (setting, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING *',
        [setting, stringValue]
      );
      console.log(`Configuração inserida:`, insertResult.rows[0]);
    } else {
      console.log(`Configuração atualizada:`, result.rows[0]);
    }
    console.log('Chamando reloadConfig...');
    await reloadConfig();
    res.status(200).json({ message: 'Configuração atualizada com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error.message, error.stack);
    res.status(500).json({ error: `Erro interno do servidor: ${error.message}` });
  }
},

  getStatus: async (req, res) => {
    const status = {
      connected: global.chatbotStatus?.connected || false,
      messagesSentToday: global.chatbotStatus?.messagesSentToday || 0,
      messagesReceivedToday: global.chatbotStatus?.messagesReceivedToday || 0,
      subscribedUsers: 0
    };
    try {
      const configResult = await pool.query(
        'SELECT setting, value FROM chatbot_config WHERE setting IN ($1, $2, $3)',
        ['connection_status', 'messages_sent_today', 'messages_received_today']
      );
      const usersResult = await pool.query('SELECT COUNT(*) AS count FROM chatbot_users WHERE subscribed = true');
      status.subscribedUsers = parseInt(usersResult.rows[0].count) || 0;
      for (const row of configResult.rows) {
        if (row.setting === 'connection_status') status.connected = row.value === '1';
        if (row.setting === 'messages_sent_today') status.messagesSentToday = parseInt(row.value) || 0;
        if (row.setting === 'messages_received_today') status.messagesReceivedToday = parseInt(row.value) || 0;
      }
      res.status(200).json(status);
    } catch (error) {
      console.error('Erro ao obter status:', error.message);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },

  getGroups: async (req, res) => {
    try {
      const groups = [
        { id: 'technicians', name: 'Técnicos', chatId: '120363401603739472@g.us' },
        { id: 'module6', name: 'Módulo 6', chatId: '120363417941205146@g.us' },
        { id: 'module7', name: 'Módulo 7', chatId: '120363419605122416@g.us' },
      ];
      res.status(200).json(groups);
    } catch (error) {
      console.error('Erro ao obter grupos:', error.message);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },

  sendBroadcast: async (req, res) => {
    const { message, groups } = req.body;
    // Validate input
    if (!message || !Array.isArray(groups) || groups.length === 0) {
      return res.status(400).json({ error: 'Mensagem e lista de grupos são obrigatórios.' });
    }
    // Validate group IDs
    const validGroups = ['technicians', 'module6', 'module7'];
    const invalidGroups = groups.filter(g => !validGroups.includes(g));
    if (invalidGroups.length > 0) {
      return res.status(400).json({ error: `Grupos inválidos: ${invalidGroups.join(', ')}.` });
    }
    try {
      await sendBroadcastMessage(message, groups);
      res.status(200).json({ message: 'Mensagem enviada com sucesso.' });
    } catch (error) {
      console.error('Erro ao enviar mensagem broadcast:', error.message);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
};

module.exports = ChatbotController;