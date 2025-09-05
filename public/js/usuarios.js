document.addEventListener('DOMContentLoaded', () => {
  const usuarioForm = document.getElementById('usuario-form');
  const usuarioTableBody = document.getElementById('usuario-tbody');
  const searchInput = document.getElementById('search');
  const feedback = document.getElementById('feedback');

  // Carregar usuários
  async function loadUsuarios() {
    try {
      const response = await fetch('/api/usuarios', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const usuarios = await response.json();
      renderUsuarios(usuarios);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      showFeedback('Erro ao carregar usuários.', 'danger');
    }
  }

  // Renderizar usuários na tabela
  function renderUsuarios(usuarios) {
    usuarioTableBody.innerHTML = '';
    usuarios.forEach(usuario => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><button class="btn btn-sm btn-primary" onclick="editUsuario(${usuario.id})"><i class="fas fa-edit"></i></button></td>
        <td>${usuario.id}</td>
        <td>${usuario.nome}</td>
        <td>${usuario.username}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteUsuario(${usuario.id})"><i class="fas fa-trash"></i></button></td>
      `;
      usuarioTableBody.appendChild(row);
    });
  }

  // Busca de usuários
  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();
    try {
      const response = await fetch(`/api/usuarios?search=${encodeURIComponent(query)}`, { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const usuarios = await response.json();
      renderUsuarios(usuarios);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      showFeedback('Erro ao buscar usuários.', 'danger');
    }
  });

  // Submissão do formulário
  usuarioForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('id').value;
    const nome = document.getElementById('nome').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    const usuario = { nome, username, password };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/usuarios/${id}` : '/api/usuarios';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(usuario),
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(result.error || 'Erro ao salvar usuário');
      }

      showFeedback(id ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!', 'success');
      clearForm();
      loadUsuarios();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      showFeedback(`Erro: ${error.message}`, 'danger');
    }
  });

  // Editar usuário
  window.editUsuario = async (id) => {
    try {
      const response = await fetch(`/api/usuarios/${id}`, { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const usuario = await response.json();
      document.getElementById('id').value = usuario.id;
      document.getElementById('nome').value = usuario.nome;
      document.getElementById('username').value = usuario.username;
      document.getElementById('password').value = ''; // Não preenche a senha por segurança
      showFeedback('Editando usuário...', 'info');
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      showFeedback('Erro ao carregar usuário.', 'danger');
    }
  };

  // Deletar usuário
  window.deleteUsuario = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(result.error || 'Erro ao excluir usuário');
      }
      showFeedback('Usuário excluído com sucesso!', 'success');
      loadUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      showFeedback(`Erro: ${error.message}`, 'danger');
    }
  };

  // Limpar formulário
  window.clearForm = () => {
    usuarioForm.reset();
    document.getElementById('id').value = '';
    showFeedback('Formulário limpo.', 'info');
  };

  // Exibir feedback
  function showFeedback(message, type) {
    feedback.textContent = message;
    feedback.className = `alert alert-${type}`;
    feedback.style.display = 'block';
    setTimeout(() => {
      feedback.style.display = 'none';
    }, 5000);
  }

  // Inicializar
  loadUsuarios();
});