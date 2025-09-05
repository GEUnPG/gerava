document.addEventListener('DOMContentLoaded', () => {
  const situacaoForm = document.getElementById('situacao-form');
  const situacaoTableBody = document.getElementById('situacao-tbody');
  const searchInput = document.getElementById('search');
  const feedback = document.getElementById('feedback');

  // Carregar situações
  async function loadSituacoes() {
    try {
      const response = await fetch('/api/situacao_aval', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const situacoes = await response.json();
      renderSituacoes(situacoes);
    } catch (error) {
      console.error('Erro ao carregar situações:', error);
      showFeedback('Erro ao carregar situações.', 'danger');
    }
  }

  // Renderizar situações na tabela
  function renderSituacoes(situacoes) {
    situacaoTableBody.innerHTML = '';
    situacoes.forEach(situacao => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><button class="btn btn-sm btn-primary" onclick="editSituacao(${situacao.id})"><i class="fas fa-edit"></i></button></td>
        <td>${situacao.id}</td>
        <td>${situacao.situacao}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteSituacao(${situacao.id})"><i class="fas fa-trash"></i></button></td>
      `;
      situacaoTableBody.appendChild(row);
    });
  }

  // Busca de situações
  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();
    try {
      const response = await fetch(`/api/situacao_aval?search=${encodeURIComponent(query)}`, { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const situacoes = await response.json();
      renderSituacoes(situacoes);
    } catch (error) {
      console.error('Erro ao buscar situações:', error);
      showFeedback('Erro ao buscar situações.', 'danger');
    }
  });

  // Submissão do formulário
  situacaoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('id').value;
    const situacao = document.getElementById('situacao').value.trim();

    const situacaoObj = { situacao };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/situacao_aval/${id}` : '/api/situacao_aval';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(situacaoObj),
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(result.error || 'Erro ao salvar situação');
      }

      showFeedback(id ? 'Situação atualizada com sucesso!' : 'Situação criada com sucesso!', 'success');
      clearForm();
      loadSituacoes();
    } catch (error) {
      console.error('Erro ao salvar situação:', error);
      showFeedback(`Erro: ${error.message}`, 'danger');
    }
  });

  // Editar situação
  window.editSituacao = async (id) => {
    try {
      const response = await fetch(`/api/situacao_aval/${id}`, { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const situacao = await response.json();
      document.getElementById('id').value = situacao.id;
      document.getElementById('situacao').value = situacao.situacao;
      showFeedback('Editando situação...', 'info');
    } catch (error) {
      console.error('Erro ao carregar situação:', error);
      showFeedback('Erro ao carregar situação.', 'danger');
    }
  };

  // Deletar situação
  window.deleteSituacao = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta situação?')) return;
    try {
      const response = await fetch(`/api/situacao_aval/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(result.error || 'Erro ao excluir situação');
      }
      showFeedback('Situação excluída com sucesso!', 'success');
      loadSituacoes();
    } catch (error) {
      console.error('Erro ao excluir situação:', error);
      showFeedback(`Erro: ${error.message}`, 'danger');
    }
  };

  // Limpar formulário
  window.clearForm = () => {
    situacaoForm.reset();
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
  loadSituacoes();
});