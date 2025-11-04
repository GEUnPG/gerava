let blockTimer = null;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const loginButton = document.getElementById('login-button');

      loginButton.disabled = true;

    try { //remover se der ruim
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password }),
    credentials: 'include'
  });

  const result = await response.json();
  if (response.ok) {
    window.location.href = '/dashboard.html';
  } else if (response.status === 429) {
    showFeedback('Muitas requisições. Tente novamente após 15 minutos.', 'error');
    startBlockTimer(15 * 60);
  } else if (result.blocked) {
    if (result.permanent) {
      showFeedback('Este dispositivo foi bloqueado permanentemente. Contate o administrador.', 'error');
    } else {
      const remainingSeconds = result.remainingSeconds;
      showFeedback(`Muitas tentativas. Tente novamente em ${Math.ceil(remainingSeconds / 60)} minutos.`, 'error');
      startBlockTimer(remainingSeconds);
    }
  } else {
    showFeedback(result.error || 'Erro ao fazer login.', 'error');
  }
} catch (error) {
  console.error('Erro ao fazer login:', error);
  showFeedback('Erro ao fazer login: ' + error.message, 'error');
}
    });//remover se der ruim

    function startBlockTimer(seconds) {
      const loginButton = document.getElementById('login-button');
      loginButton.disabled = true;

      if (blockTimer) clearInterval(blockTimer);

      let timeLeft = seconds;
      updateTimerDisplay(timeLeft);

      blockTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);

        if (timeLeft <= 0) {
          clearInterval(blockTimer);
          blockTimer = null;
          loginButton.disabled = false;
          showFeedback('Bloqueio expirado. Tente fazer login novamente.', 'success');
        }
      }, 1000);
    }

    function updateTimerDisplay(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      const feedback = document.getElementById('feedback');
      feedback.textContent = `Bloqueado. Tente novamente em ${minutes}:${secs.toString().padStart(2, '0')}.`;
      feedback.className = 'text-error';
      feedback.style.display = 'block';
    }

    function showFeedback(message, type) {
      const feedback = document.getElementById('feedback');
      feedback.textContent = message;
      feedback.className = `text-${type}`;
      feedback.style.display = 'block';

      if (!message.includes('Bloqueado') && !message.includes('permanentemente')) {
        setTimeout(() => {
          feedback.style.display = 'none';
        }, 5000);
      }

      showToast(message, type);
    }

    function showToast(message, type) {
      const existingToasts = document.querySelectorAll('.toast');
      existingToasts.forEach(toast => toast.remove());

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
      }, 5000);
    }