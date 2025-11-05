//refatorado em 2024-06-10
document.addEventListener('DOMContentLoaded', () => {
  const laboratorioForm = document.getElementById('laboratorio-form');
  const laboratorioTableBody = document.getElementById('laboratorio-tbody');
  const searchInput = document.getElementById('search');
  const feedback = document.getElementById('feedback');

  // Carregar conjuntos de laboratórios
  async function loadLaboratorios() {
    try {
      console.log('Carregando conjuntos de laboratórios...');
      const response = await fetch('/api/laboratorios', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Erro ao carregar conjuntos: Status ${response.status}`);
      }
      const laboratorios = await response.json();
      renderLaboratorios(laboratorios);
      console.log('Conjuntos carregados:', laboratorios);
    } catch (error) {
      console.error('Erro ao carregar conjuntos:', error);
      showFeedback('Erro ao carregar conjuntos: ' + error.message, 'danger');
    }
  }

  // Renderizar conjuntos na tabela
  function renderLaboratorios(laboratorios) {
    laboratorioTableBody.innerHTML = '';
    for (const lab of laboratorios) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><button class="btn btn-sm btn-primary" onclick="editLaboratorio(${lab.id})"><i class="fas fa-edit"></i></button></td>
        <td>${lab.id}</td>
        <td>${lab.nome}</td>
        <td>${lab.qtd_com_total}</td>
        <td>${lab.qtd_sem_total}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteLaboratorio(${lab.id})"><i class="fas fa-trash"></i></button></td>
      `;
      laboratorioTableBody.appendChild(row);
    }
  }

  // Busca de conjuntos
  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();
    try {
      console.log('Buscando conjuntos com termo:', query);
      const response = await fetch(`/api/laboratorios?search=${encodeURIComponent(query)}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Erro ao buscar conjuntos: Status ${response.status}`);
      }
      const laboratorios = await response.json();
      renderLaboratorios(laboratorios);
      console.log('Conjuntos filtrados:', laboratorios);
    } catch (error) {
      console.error('Erro ao buscar conjuntos:', error);
      showFeedback('Erro ao buscar conjuntos: ' + error.message, 'danger');
    }
  });

  // Submissão do formulário
  laboratorioForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Formulário enviado');
    const id = document.getElementById('id').value;
    const laboratorioObj = {
      nome: document.getElementById('nome').value.trim(),
      qtd_com_total: Number.parseInt(document.getElementById('qtd_com_total').value) || 0,
      qtd_sem_total: Number.parseInt(document.getElementById('qtd_sem_total').value) || 0
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/laboratorios/${id}` : '/api/laboratorios';

    try {
      console.log('Dados enviados:', laboratorioObj);
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(laboratorioObj),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar conjunto');
      }

      showFeedback(id ? 'Conjunto atualizado com sucesso!' : 'Conjunto criado com sucesso!', 'success');
      clearForm();
      loadLaboratorios();
    } catch (error) {
      console.error('Erro ao salvar conjunto:', error);
      showFeedback(`Erro ao salvar conjunto: ${error.message}`, 'danger');
    }
  });

  // Editar conjunto
  globalThis.window.editLaboratorio = async (id) => {
    try {
      console.log(`Carregando conjunto ${id} para edição`);
      const response = await fetch(`/api/laboratorios/${id}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Erro ao carregar conjunto: Status ${response.status}`);
      }
      const lab = await response.json();
      document.getElementById('id').value = lab.id;
      document.getElementById('nome').value = lab.nome;
      document.getElementById('qtd_com_total').value = lab.qtd_com_total;
      document.getElementById('qtd_sem_total').value = lab.qtd_sem_total;
      showFeedback('Carregando conjunto para edição...', 'info');
    } catch (error) {
      console.error('Erro ao carregar conjunto:', error);
      showFeedback('Erro ao carregar conjunto: ' + error.message, 'danger');
    }
  };

  // Deletar conjunto
  globalThis.window.deleteLaboratorio = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este conjunto?')) return;
    try {
      console.log(`Excluindo conjunto ${id}`);
      const response = await fetch(`/api/laboratorios/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir conjunto');
      }
      showFeedback('Conjunto excluído com sucesso!', 'success');
      loadLaboratorios();
    } catch (error) {
      console.error('Erro ao excluir conjunto:', error);
      showFeedback(`Erro ao excluir conjunto: ${error.message}`, 'danger');
    }
  };

  // Limpar formulário
  globalThis.window.clearForm = () => {
    console.log('Resetando formulário');
    laboratorioForm.reset();
    document.getElementById('id').value = '';
    showFeedback('Formulário limpo.', 'info');
  };

  // Exibir feedback
  function showFeedback(message, type) {
    console.log(`Feedback: ${message} (${type})`);
    feedback.textContent = message;
    feedback.className = `alert alert-${type}`;
    feedback.style.display = 'block';
    setTimeout(() => {
      feedback.style.display = 'none';
    }, 3000);
  }

  // Inicializar
  loadLaboratorios();
});