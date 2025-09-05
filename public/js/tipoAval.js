document.addEventListener('DOMContentLoaded', () => {
  const tipoForm = document.getElementById('tipo-form');
  const tipoTableBody = document.getElementById('tipo-tbody');
  const searchInput = document.getElementById('search');
  const feedback = document.getElementById('feedback');

  // Carregar tipos
  async function loadTipos() {
    try {
      const response = await fetch('/api/tipo_aval', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const tipos = await response.json();
      renderTipos(tipos);
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
      showFeedback('Erro ao carregar tipos.', 'danger');
    }
  }

  // Renderizar tipos na tabela
  function renderTipos(tipos) {
    tipoTableBody.innerHTML = '';
    tipos.forEach(tipo => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><button class="btn btn-sm btn-primary" onclick="editTipo(${tipo.id})"><i class="fas fa-edit"></i></button></td>
        <td>${tipo.id}</td>
        <td>${tipo.tipo}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteTipo(${tipo.id})"><i class="fas fa-trash"></i></button></td>
      `;
      tipoTableBody.appendChild(row);
    });
  }

  // Busca de tipos
  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();
    try {
      const response = await fetch(`/api/tipo_aval?search=${encodeURIComponent(query)}`, { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const tipos = await response.json();
      renderTipos(tipos);
    } catch (error) {
      console.error('Erro ao buscar tipos:', error);
      showFeedback('Erro ao buscar tipos.', 'danger');
    }
  });

  // Submissão do formulário
  tipoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('id').value;
    const tipo = document.getElementById('tipo').value.trim();

    const tipoObj = { tipo };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/tipo_aval/${id}` : '/api/tipo_aval';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(tipoObj),
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(result.error || 'Erro ao salvar tipo');
      }

      showFeedback(id ? 'Tipo atualizado com sucesso!' : 'Tipo criado com sucesso!', 'success');
      clearForm();
      loadTipos();
    } catch (error) {
      console.error('Erro ao salvar tipo:', error);
      showFeedback(`Erro: ${error.message}`, 'danger');
    }
  });

  // Editar tipo
  window.editTipo = async (id) => {
    try {
      const response = await fetch(`/api/tipo_aval/${id}`, { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const tipo = await response.json();
      document.getElementById('id').value = tipo.id;
      document.getElementById('tipo').value = tipo.tipo;
      showFeedback('Editando tipo...', 'info');
    } catch (error) {
      console.error('Erro ao carregar tipo:', error);
      showFeedback('Erro ao carregar tipo.', 'danger');
    }
  };

  // Deletar tipo
  window.deleteTipo = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este tipo?')) return;
    try {
      const response = await fetch(`/api/tipo_aval/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(result.error || 'Erro ao excluir tipo');
      }
      showFeedback('Tipo excluído com sucesso!', 'success');
      loadTipos();
    } catch (error) {
      console.error('Erro ao excluir tipo:', error);
      showFeedback(`Erro: ${error.message}`, 'danger');
    }
  };

  // Limpar formulário
  window.clearForm = () => {
    tipoForm.reset();
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
  loadTipos();
});