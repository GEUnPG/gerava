document.addEventListener('DOMContentLoaded', () => {
  loadAvaliacoes();
});

async function loadAvaliacoes() {
  try {
    console.log('Carregando avaliações arquivadas...');
    const response = await fetch('/api/arquivo', { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Erro HTTP! Status: ${response.status}`);
    }
    const avaliacoes = await response.json();
    console.log('Avaliações arquivadas carregadas:', avaliacoes);
    renderAvaliacoes(avaliacoes);
  } catch (error) {
    console.error('Erro ao carregar avaliações:', error);
    showFeedback('Erro ao carregar avaliações: ' + error.message, 'danger');
  }
}

function renderAvaliacoes(avaliacoes) {
  const tbody = document.getElementById('avaliacao-tbody');
  tbody.innerHTML = '';
  if (avaliacoes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma avaliação arquivada encontrada.</td></tr>';
    return;
  }
  avaliacoes.forEach(aval => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <button class="btn btn-success btn-sm" onclick="restoreAvaliacao(${aval.id})" title="Restaurar">
          <i class="fas fa-undo"></i>
        </button>
        <button class="btn btn-danger btn-sm" onclick="deletePermanently(${aval.id})" title="Excluir Permanentemente">
          <i class="fas fa-trash"></i>
        </button>
      </td>
      <td>${formatDate(aval.data)}</td>
      <td>${aval.disciplina_nome || 'N/A'}</td>
      <td>${aval.modulo_nome || 'N/A'}</td>
      <td>${aval.professor_nome || 'N/A'}</td>
      <td>${formatTime(aval.horario_ini)} - ${formatTime(aval.horario_fim)}</td>
      <td>${aval.laboratorios.map(lab => lab.nome).join(', ') || 'N/A'}</td>
    `;
    tbody.appendChild(row);
  });
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
}

function formatTime(timeStr) {
  if (!timeStr) return 'N/A';
  return timeStr.slice(0, 5);
}

async function restoreAvaliacao(id) {
  if (!confirm('Deseja restaurar esta avaliação?')) return;
  try {
    const response = await fetch(`/api/arquivo/restore/${id}`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Erro HTTP! Status: ${response.status}`);
    }
    const data = await response.json();
    showFeedback(data.message, 'success');
    loadAvaliacoes();
  } catch (error) {
    console.error('Erro ao restaurar avaliação:', error);
    showFeedback('Erro ao restaurar avaliação: ' + error.message, 'danger');
  }
}

async function deletePermanently(id) {
  if (!confirm('Deseja excluir permanentemente esta avaliação? Esta ação não pode ser desfeita.')) return;
  try {
    const response = await fetch(`/api/arquivo/delete/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Erro HTTP! Status: ${response.status}`);
    }
    const data = await response.json();
    showFeedback(data.message, 'success');
    loadAvaliacoes();
  } catch (error) {
    console.error('Erro ao excluir avaliação:', error);
    showFeedback('Erro ao excluir avaliação: ' + error.message, 'danger');
  }
}

function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = `alert alert-${type} alert-dismissible fade show`;
  feedback.style.display = 'block';
  setTimeout(() => {
    feedback.style.display = 'none';
  }, 5000);
}