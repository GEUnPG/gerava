//refatorado 2025-06-10
///public/js/main_arquivo.js
document.addEventListener('DOMContentLoaded', () => {
  loadAvaliacoes();
});

// ===== HELPERS =====

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
}

function formatTime(timeStr) {
  if (!timeStr) return 'N/A';
  return timeStr.slice(0, 5);
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

// ===== API HELPERS =====

async function fetchApi(url, options = {}) {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro na requisição para ${url}:`, error);
    throw error;
  }
}

async function handleApiCall(apiCall, successMessage, errorPrefix) {
  try {
    const data = await apiCall();
    if (successMessage) {
      showFeedback(data.message || successMessage, 'success');
    }
    return data;
  } catch (error) {
    showFeedback(`${errorPrefix}: ${error.message}`, 'danger');
    throw error;
  }
}

// ===== AVALIACOES CRUD =====

async function loadAvaliacoes() {
  console.log('Carregando avaliações arquivadas...');
  
  await handleApiCall(
    async () => {
      const avaliacoes = await fetchApi('/api/arquivo');
      console.log('Avaliações arquivadas carregadas:', avaliacoes);
      renderAvaliacoes(avaliacoes);
      return avaliacoes;
    },
    null,
    'Erro ao carregar avaliações'
  );
}

function createAvaliacaoRow(aval) {
  const row = document.createElement('tr');
  
  const laboratorios = aval.laboratorios?.map(lab => lab.nome).join(', ') || 'N/A';
  
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
    <td>${laboratorios}</td>
  `;
  
  return row;
}

function renderAvaliacoes(avaliacoes) {
  const tbody = document.getElementById('avaliacao-tbody');
  tbody.innerHTML = '';
  
  if (avaliacoes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma avaliação arquivada encontrada.</td></tr>';
    return;
  }
  
  // ✅ CORREÇÃO: for...of ao invés de forEach
  for (const aval of avaliacoes) {
    const row = createAvaliacaoRow(aval);
    tbody.appendChild(row);
  }
}

async function restoreAvaliacao(id) {
  if (!confirm('Deseja restaurar esta avaliação?')) return;
  
  await handleApiCall(
    async () => {
      const data = await fetchApi(`/api/arquivo/restore/${id}`, {
        method: 'POST',
      });
      loadAvaliacoes();
      return data;
    },
    'Avaliação restaurada com sucesso',
    'Erro ao restaurar avaliação'
  );
}

async function deletePermanently(id) {
  if (!confirm('Deseja excluir permanentemente esta avaliação? Esta ação não pode ser desfeita.')) return;
  
  await handleApiCall(
    async () => {
      const data = await fetchApi(`/api/arquivo/delete/${id}`, {
        method: 'DELETE',
      });
      loadAvaliacoes();
      return data;
    },
    'Avaliação excluída permanentemente com sucesso',
    'Erro ao excluir avaliação'
  );
}
