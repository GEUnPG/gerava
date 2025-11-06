(async () => { //NOSONAR
  try {
    const response = await fetch('/api/user', { credentials: 'include' });
    if (!response.ok) {
      globalThis.location.href = '/login.html';
      throw new Error('Não autenticado');
    }
    const data = await response.json();
    document.getElementById('user-greeting').textContent = `Bem-vindo, ${data.nome}`;
  } catch (error) {
    console.error('Erro ao carregar usuário:', error);
    globalThis.location.href = '/login.html';
  }
})();

async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    globalThis.location.href = '/index.html';
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }

}
