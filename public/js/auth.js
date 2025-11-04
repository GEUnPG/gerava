fetch('/api/user', { credentials: 'include' })
      .then(response => {
        if (!response.ok) {
          globalThis.location.href = '/login.html';
          throw new Error('Não autenticado');
        }
        return response.json();
      })
      .then(data => {
        document.getElementById('user-greeting').textContent = `Bem-vindo, ${data.nome}`;
      })
      .catch(error => {
        console.error('Erro ao carregar usuário:', error);
        globalThis.location.href = '/login.html';
      });

    function logout() {
      fetch('/api/logout', { method: 'POST', credentials: 'include' })
        .then(() => {
          globalThis.location.href = '/index.html';
        })
        .catch(error => {
          console.error('Erro ao fazer logout:', error);
        });
    }