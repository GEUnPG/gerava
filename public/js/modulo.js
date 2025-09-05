document.addEventListener('DOMContentLoaded', () => {
  const moduloForm = document.getElementById('modulo-form');
  const moduloTableBody = document.getElementById('modulo-tbody');
  const searchInput = document.getElementById('search');
  const feedback = document.getElementById('feedback');

  // Carregar módulos
  async function loadModulos() {
    try {
      const response = await fetch('/api/modulos', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const modulos = await response.json();
      renderModulos(modulos);
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
      showFeedback('Erro ao carregar módulos.', 'danger');
    }
  }

  // Renderizar módulos na tabela
  function renderModulos(modulos) {
    moduloTableBody.innerHTML = '';
    modulos.forEach(modulo => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><button class="btn btn-sm btn-primary" onclick="editModulo(${modulo.id})"><i class="fas fa-edit"></i></button></td>
        <td>${modulo.id}</td>
        <td>${modulo.nome}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteModulo(${modulo.id})"><i class="fas fa-trash"></i></button></td>
      `;
      moduloTableBody.appendChild(row);
    });
  }

  // Busca de módulos
  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();
    try {
      const response = await fetch(`/api/modulos?search=${encodeURIComponent(query)}`, { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const modulos = await response.json();
      renderModulos(modulos);
    } catch (error) {
      console.error('Erro ao buscar módulos:', error);
      showFeedback('Erro ao buscar módulos.', 'danger');
    }
  });

  // Submissão do formulário
  moduloForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('id').value;
    const nome = document.getElementById('nome').value.trim();

    const moduloObj = { nome };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/modulos/${id}` : '/api/modulos';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(moduloObj),
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(result.error || 'Erro ao salvar módulo');
      }

      showFeedback(id ? 'Módulo atualizado com sucesso!' : 'Módulo criado com sucesso!', 'success');
      clearForm();
      loadModulos();
    } catch (error) {
      console.error('Erro ao salvar módulo:', error);
      showFeedback(`Erro: ${error.message}`, 'danger');
    }
  });

  // Editar módulo
  window.editModulo = async (id) => {
    try {
      const response = await fetch(`/api/modulos/${id}`, { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const modulo = await response.json();
      document.getElementById('id').value = modulo.id;
      document.getElementById('nome').value = modulo.nome;
      showFeedback('Editando módulo...', 'info');
    } catch (error) {
      console.error('Erro ao carregar módulo:', error);
      showFeedback('Erro ao carregar módulo.', 'danger');
    }
  };

  // Deletar módulo
  window.deleteModulo = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este módulo?')) return;
    try {
      const response = await fetch(`/api/modulos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
          return;
        }
        throw new Error(result.error || 'Erro ao excluir módulo');
      }
      showFeedback('Módulo excluído com sucesso!', 'success');
      loadModulos();
    } catch (error) {
      console.error('Erro ao excluir módulo:', error);
      showFeedback(`Erro: ${error.message}`, 'danger');
    }
  };

  // Limpar formulário
  window.clearForm = () => {
    moduloForm.reset();
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
  loadModulos();
});