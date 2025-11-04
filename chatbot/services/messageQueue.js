// chatbot/services/messageQueue.js
class MessageQueue {
  constructor() {
    this.jobs = [];
    this.isProcessing = false;
  }

  // ✅ SOLUÇÃO 1: Tornar método async (mais simples)
  async add(job, options = {}) {
    this.jobs.push({ ...job, delay: options.delay || 0 });
    if (!this.isProcessing) {
      this.process();
    }
  }

  async process() {
    if (this.isProcessing) return;
    
    const { chatbotStatus } = require('./statusService');
    const { updateStatus } = require('./configService');
    
    if (!chatbotStatus.connected) {
      console.log('messageQueue: cliente não conectado, aguardando conexão.');
      return;
    }

    this.isProcessing = true;
    
    while (this.jobs.length > 0) {
      const job = this.jobs.shift();
      
      if (job.delay) {
        await new Promise(resolve => setTimeout(resolve, job.delay));
      }

      try {
        const { getClient } = require('../whatsapp/clientManager');
        const client = getClient();
        
        if (!client) throw new Error('Cliente WhatsApp não inicializado.');
        
        await client.sendMessage(job.chatId, job.message);
        chatbotStatus.messagesSentToday++;

        if (chatbotStatus.messagesSentToday % 100 === 0) {
          await updateStatus();
        }
      } catch (error) {
        console.error(`Erro ao enviar mensagem para ${job.chatId}:`, error.message);
        
        if (!chatbotStatus.connected) {
          this.jobs.unshift(job);
          break;
        }
      }
    }
    
    this.isProcessing = false;
  }
}

module.exports = new MessageQueue();
