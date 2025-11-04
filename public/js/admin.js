document.addEventListener('DOMContentLoaded', () => {
  const startChatbotButton = document.getElementById('startChatbot');
  const chatbotStatus = document.getElementById('chatbotStatus');
  const qrCodeContainer = document.getElementById('qrCodeContainer');
  const qrCodeImage = document.getElementById('qrCodeImage');
  const notificationsButton = document.getElementById('notifications');
  const autoRepliesButton = document.getElementById('autoReplies');
  const menuButton = document.getElementById('menu');
  let ws = null; // Inicializa como null
  let isChatbotConnected = false;


  function connectWebSocket() {
    // Evitar criar nova conexão se já existir uma ativa
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('Conexão WebSocket já ativa, ignorando nova conexão.');
      return;
    }


    const protocol = globalThis.window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${globalThis.window.location.host}`);


    ws.onopen = () => {
      console.log('Conectado ao WebSocket.');
      updateChatbotStatus('Conectado ao servidor. Aguardando status do chatbot.');
    };


    ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  } catch (error) {
    console.error('Erro ao processar mensagem WebSocket:', error);
    showToast('Erro ao processar mensagem do servidor.', 'error');
  }
};

// Função auxiliar para lidar com mensagens WebSocket
function handleWebSocketMessage(data) {
  // Ações comuns para múltiplos casos
  const hideQrCode = () => {
    qrCodeContainer.style.display = 'none';
  };

  const updateConnectionState = (connected) => {
    isChatbotConnected = connected;
    updateStartButton();
    loadStatus();
  };

  switch (data.type) {
    case 'qr':
      qrCodeImage.src = data.data;
      qrCodeContainer.style.display = 'block';
      updateChatbotStatus('Escaneie o QR code para conectar o chatbot.');
      showToast('QR code gerado. Escaneie para conectar.', 'success');
      break;

    case 'connected':
      hideQrCode();
      updateChatbotStatus(data.message);
      updateConnectionState(true);
      showToast(data.message, 'success');
      break;

    case 'disconnected':
      hideQrCode();
      updateChatbotStatus(data.message);
      updateConnectionState(false);
      showToast(data.message, 'error');
      break;

    case 'status':
      hideQrCode(); // Sempre esconde o QR code no status (corrigido a lógica redundante)
      updateChatbotStatus(data.message);
      updateConnectionState(data.connected);
      break;

    case 'error':
      hideQrCode();
      updateChatbotStatus(`Erro: ${data.message}`);
      showToast(`Erro: ${data.message}`, 'error');
      break;

    default:
      console.warn('Tipo de mensagem WebSocket desconhecido:', data.type);
      break;
  }
}



    ws.onclose = () => {
      console.log('WebSocket desconectado. Tentando reconectar...');
      updateChatbotStatus('Desconectado do servidor. Tentando reconectar...');
      ws = null; // Limpa a referência
      setTimeout(connectWebSocket, 5000);
    };


    ws.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
      updateChatbotStatus('Erro na conexão com o servidor.');
      showToast('Erro na conexão com o servidor.', 'error');
    };
  }


  function updateChatbotStatus(message) {
    chatbotStatus.textContent = message;
  }


  function updateStartButton() {
    if (isChatbotConnected) {
      startChatbotButton.textContent = 'Parar Chatbot';
      startChatbotButton.className = 'btn btn-danger';
    } else {
      startChatbotButton.textContent = 'Iniciar Chatbot';
      startChatbotButton.className = 'btn btn-success';
    }
    startChatbotButton.disabled = false;
  }


  function showToast(message, type) {
    const existingToasts = document.querySelectorAll('.toast');
    // ✅ CORREÇÃO 1: Convertido de forEach para for...of
    for (const toast of existingToasts) {
      toast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast d-flex align-items-center';
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'times-circle'} me-2"></i>
      <span>${message}</span>
    `;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '1000';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.transform = 'translateY(20px)';
    if (type === 'success') {
      toast.style.background = '#10b981';
      toast.style.color = '#fff';
    } else if (type === 'error') {
      toast.style.background = '#ef4444';
      toast.style.color = '#fff';
    }
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 100);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }


  async function loadStatus() {
    try {
      const response = await fetch('/api/chatbot/status', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          globalThis.window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const status = await response.json();
      document.getElementById('connection').textContent = status.connected ? 'Conectado' : 'Desconectado';
      document.getElementById('connection').className = status.connected ? 'text-success' : 'text-danger';
      document.getElementById('sent').textContent = status.messagesSentToday || 0;
      document.getElementById('received').textContent = status.messagesReceivedToday || 0;
      document.getElementById('subscribed').textContent = status.subscribedUsers || 0;
    } catch (error) {
      console.error('Erro ao carregar status:', error.message);
      showToast('Erro ao carregar status.', 'error');
    }
  }


  async function loadConfig() {
    const buttons = {
      notifications: notificationsButton,
      autoReplies: autoRepliesButton,
      menu: menuButton
    };
    try {
      const response = await fetch('/api/chatbot/config', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          globalThis.window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const configs = await response.json();
      for (const config of configs) {
        const buttonId = config.setting.replace('_enabled', '').replace('auto_replies', 'autoReplies');
        const button = buttons[buttonId];
        if (button) {
          button.textContent = config.value === '1' ? 'Desativar' : 'Ativar';
          button.className = config.value === '1' ? 'btn btn-danger' : 'btn btn-success';
          button.disabled = false;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error.message);
      showToast('Erro ao carregar configurações.', 'error');
      // ✅ CORREÇÃO 2: Convertido de forEach para for...of
      for (const button of Object.values(buttons)) {
        button.textContent = 'Erro';
        button.className = 'btn btn-secondary';
        button.disabled = false;
      }
    }
  }


  async function toggleConfig(setting, value) {
    const buttonId = setting.replace('_enabled', '').replace('auto_replies', 'autoReplies');
    const button = document.getElementById(buttonId);
    try {
      button.disabled = true;
      button.textContent = 'Carregando...';
      console.log(`Enviando POST /api/chatbot/config: setting=${setting}, value=${value}`);
      const response = await fetch('/api/chatbot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ setting, value })
      });
      if (!response.ok) {
        if (response.status === 401) {
          globalThis.window.location.href = '/login.html';
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      showToast(data.message, 'success');
      await loadConfig();
    } catch (error) {
      console.error(`Erro ao alternar ${setting}:`, error.message);
      showToast(`Erro ao atualizar configuração: ${error.message}`, 'error');
      button.textContent = 'Erro';
      button.className = 'btn btn-secondary';
      setTimeout(() => {
        loadConfig();
      }, 2000);
    }
  }


  async function loadGroups() {
    const groupSelect = document.getElementById('groupSelect');
    try {
      const response = await fetch('/api/chatbot/groups', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          globalThis.window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const groups = await response.json();
      groupSelect.innerHTML = '';
      for (const group of groups) {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        groupSelect.appendChild(option);
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error.message);
      showToast('Erro ao carregar grupos.', 'error');
      groupSelect.innerHTML = '<option>Erro ao carregar grupos</option>';
    }
  }


  function setupGroupSelection() {
    const groupSelect = document.getElementById('groupSelect');
    const selectAllGroups = document.getElementById('selectAllGroups');
    selectAllGroups.addEventListener('change', () => {
      for (const option of groupSelect.options) {
        option.selected = selectAllGroups.checked;
      }
    });
    groupSelect.addEventListener('change', () => {
      const allSelected = Array.from(groupSelect.options).every(option => option.selected);
      selectAllGroups.checked = allSelected;
    });
  }


  async function sendBroadcastMessage() {
    const message = document.getElementById('broadcastMessage').value.trim();
    const groupSelect = document.getElementById('groupSelect');
    const selectedGroups = Array.from(groupSelect.selectedOptions).map(option => option.value);
    const broadcastStatus = document.getElementById('broadcastStatus');
    const sendButton = document.getElementById('sendBroadcast');
    if (!message) {
      broadcastStatus.textContent = 'Digite uma mensagem.';
      broadcastStatus.className = 'text-danger';
      showToast('Digite uma mensagem.', 'error');
      return;
    }
    if (selectedGroups.length === 0) {
      broadcastStatus.textContent = 'Selecione pelo menos um grupo.';
      broadcastStatus.className = 'text-danger';
      showToast('Selecione pelo menos um grupo.', 'error');
      return;
    }
    try {
      sendButton.disabled = true;
      broadcastStatus.textContent = 'Enviando...';
      broadcastStatus.className = 'text-primary';
      const response = await fetch('/api/chatbot/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message, groups: selectedGroups })
      });
      if (!response.ok) {
        if (response.status === 401) {
          globalThis.window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      broadcastStatus.textContent = result.message;
      broadcastStatus.className = 'text-success';
      showToast(result.message, 'success');
      document.getElementById('broadcastMessage').value = '';
      groupSelect.selectedIndex = -1;
      document.getElementById('selectAllGroups').checked = false;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error.message);
      broadcastStatus.textContent = 'Erro ao enviar mensagem.';
      broadcastStatus.className = 'text-danger';
      showToast('Erro ao enviar mensagem.', 'error');
    } finally {
      sendButton.disabled = false;
    }
  }


  async function loadAttempts() {
    try {
      const response = await fetch('/api/login-attempts', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          globalThis.window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const attempts = await response.json();
      const tbody = document.getElementById('attempts-body');
      tbody.innerHTML = '';
      for (const attempt of attempts) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${attempt.id}</td>
          <td>${attempt.ip}</td>
          <td>${attempt.username || 'N/A'}</td>
          <td>${attempt.attempt_count}</td>
          <td>${attempt.block_count}</td>
          <td>${attempt.block_until ? new Date(attempt.block_until).toLocaleString('pt-BR') : 'N/A'}</td>
          <td>${attempt.is_permanently_blocked ? 'Sim' : 'Não'}</td>
          <td><button class="btn btn-sm btn-primary unblock-btn" data-ip="${attempt.ip}">Desbloquear</button></td>
        `;
        tbody.appendChild(row);
      }
      // Adicionar event listeners aos botões de desbloqueio
      for (const btn of document.querySelectorAll('.unblock-btn')) {
        btn.addEventListener('click', () => unblockIp(btn.dataset.ip));
      }
    } catch (error) {
      console.error('Erro ao carregar tentativas:', error.message);
      showAttemptsFeedback('Erro: ' + error.message, 'error');
    }
  }


  async function unblockIp(ip) {
    try {
      const response = await fetch('/api/unblock-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ip })
      });
      if (!response.ok) {
        if (response.status === 401) {
          globalThis.window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      showAttemptsFeedback(result.message, 'success');
      loadAttempts();
    } catch (error) {
      console.error('Erro ao desbloquear IP:', error.message);
      showAttemptsFeedback('Erro: ' + error.message, 'error');
    }
  }


  function showAttemptsFeedback(message, type) {
    const feedback = document.getElementById('attempts-feedback');
    feedback.textContent = message;
    feedback.className = `text-${type}`;
    feedback.style.display = 'block';
    setTimeout(() => {
      feedback.style.display = 'none';
    }, 5000);
  }


  // ✅ CORREÇÃO 3: Funções extraídas para reduzir complexidade cognitiva
  async function stopChatbot() {
    try {
      updateChatbotStatus('Parando chatbot...');
      showToast('Parando chatbot...', 'info');
      
      const response = await fetch('/api/chatbot/stop', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          globalThis.window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      updateChatbotStatus(data.message);
      isChatbotConnected = false;
      updateStartButton();
      showToast(data.message, 'success');
      loadStatus();
    } catch (error) {
      console.error('Erro ao parar chatbot:', error.message);
      updateChatbotStatus('Erro ao parar chatbot.');
      showToast('Erro ao parar chatbot.', 'error');
    }
  }


  async function startChatbot() {
    try {
      updateChatbotStatus('Iniciando chatbot...');
      showToast('Iniciando chatbot...', 'info');
      
      const response = await fetch('/api/start-chatbot', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          globalThis.window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      updateChatbotStatus(data.message);
      
      if (data.connected) {
        isChatbotConnected = true;
        updateStartButton();
        qrCodeContainer.style.display = 'none';
        showToast(data.message, 'success');
      }
    } catch (error) {
      console.error('Erro ao iniciar chatbot:', error.message);
      updateChatbotStatus('Erro ao iniciar chatbot.');
      showToast('Erro ao iniciar chatbot.', 'error');
    }
  }


  // Configurar event listeners para botões de configuração
  notificationsButton.addEventListener('click', () => {
    const currentValue = notificationsButton.textContent === 'Desativar' ? '0' : '1';
    toggleConfig('notifications_enabled', currentValue);
  });


  autoRepliesButton.addEventListener('click', () => {
    const currentValue = autoRepliesButton.textContent === 'Desativar' ? '0' : '1';
    toggleConfig('auto_replies_enabled', currentValue);
  });


  menuButton.addEventListener('click', () => {
    const currentValue = menuButton.textContent === 'Desativar' ? '0' : '1';
    toggleConfig('menu_enabled', currentValue);
  });


  // ✅ CORREÇÃO 3: Event listener simplificado usando funções extraídas
  startChatbotButton.addEventListener('click', async () => {
    if (isChatbotConnected) {
      await stopChatbot();
    } else {
      await startChatbot();
    }
  });


  // Inicializar
  connectWebSocket();
  loadStatus();
  loadConfig();
  loadGroups();
  setupGroupSelection();
  loadAttempts();
  setInterval(loadStatus, 60000);
  document.getElementById('sendBroadcast').addEventListener('click', sendBroadcastMessage);
});
