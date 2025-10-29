// Função auxiliar para formatar data no formato dd-mm-aaaa #analisando brechas de segurança xss
function formatDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Estado global de paginação
let currentPage = 1;
let totalPages = 1;
let limit = 10;

// Armazena todas as avaliações quando em busca avançada
let allAvaliacoes = [];

document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando consulta pública...');
  loadAvaliacoes(currentPage);

  // Evento de busca dinâmica
  document.getElementById('search').addEventListener('input', async (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm.trim() === "") {
      // Se não houver busca, volta para a paginação normal
      allAvaliacoes = [];
      currentPage = 1;
      loadAvaliacoes(currentPage);
    } else {
      console.log('Termo de busca:', searchTerm);
      await loadAllAvaliacoes(); // busca todas sem paginação
      filterAvaliacoes(searchTerm);
    }
  });

  // Eventos dos botões de paginação
  document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadAvaliacoes(currentPage);
    }
  });

  document.getElementById('next-page').addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadAvaliacoes(currentPage);
    }
  });
});

// Carrega avaliações paginadas da API
async function loadAvaliacoes(page) {
  try {
    console.log(`Carregando avaliações públicas (página ${page})...`);
    const response = await fetch(`/api/consulta/public?page=${page}&limit=${limit}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP! Status: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    console.log('Resultado paginado:', result);

    renderAvaliacoes(result.data);
    currentPage = result.currentPage;
    totalPages = result.totalPages;
    updatePaginationControls();
  } catch (error) {
    console.error('Erro ao carregar avaliações:', error);
    showFeedback('Erro ao carregar avaliações: ' + error.message, 'error');
  }
}

// Carrega todas as avaliações sem paginação (usado na busca)
async function loadAllAvaliacoes() {
  try {
    console.log('Carregando todas as avaliações públicas (sem paginação)...');
    const response = await fetch('/api/consulta/public-all');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP! Status: ${response.status} - ${errorText}`);
    }
    allAvaliacoes = await response.json();
    console.log('Avaliações carregadas (sem paginação):', allAvaliacoes);
  } catch (error) {
    console.error('Erro ao carregar avaliações sem paginação:', error);
    showFeedback('Erro ao carregar todas as avaliações: ' + error.message, 'error');
  }
}

// Renderiza tabela
function renderAvaliacoes(avaliacoes) {
  const tbody = document.getElementById('avaliacao-tbody');
  tbody.innerHTML = '';
  avaliacoes.forEach(ava => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${ava.id}</td>
      <td>${ava.situacao}</td>
      <td>${ava.tipo}</td>
      <td>${formatDate(ava.data)}</td>
      <td>${ava.horario_ini ? `${ava.horario_ini.slice(0, 5)} - ${ava.horario_fim.slice(0, 5)}` : ''}</td>
      <td>${ava.qtd_alunos || ''}</td>
      <td>${ava.caip ? 'Sim' : 'Não'}</td>
      <td>${ava.modulo_nome || ava.modulo_id || ''}</td>
      <td>${ava.disciplina_nome || 'Disciplina ' + ava.disciplina_id || ''}</td>
      <td>${ava.professor_nome || 'Professor ' + ava.professor_id || ''}</td>
      <td>${ava.qtd_objetiva || ''}</td>
      <td>${ava.qtd_discursiva || ''}</td>
      <td>${ava.laboratorios?.map(l => `${l.nome} (Capacidade: ${ava.caip ? l.qtd_com_total : l.qtd_sem_total})`).join(', ') || ''}</td>
    `;
    tbody.appendChild(row);
  });
}

// Filtro de busca (somente em allAvaliacoes)
function filterAvaliacoes(searchTerm) {
  const filteredAvaliacoes = allAvaliacoes.filter(ava => {
    const data = formatDate(ava.data).toLowerCase();
    const modulo = (ava.modulo_nome || '').toLowerCase();
    const professor = (ava.professor_nome || '').toLowerCase();
    const horario = ava.horario_ini ? `${ava.horario_ini.slice(0, 5)} - ${ava.horario_fim.slice(0, 5)}`.toLowerCase() : '';

    return (
      data.includes(searchTerm) ||
      modulo.includes(searchTerm) ||
      professor.includes(searchTerm) ||
      horario.includes(searchTerm)
    );
  });
  console.log('Avaliações filtradas:', filteredAvaliacoes);
  renderAvaliacoes(filteredAvaliacoes);
  // Oculta paginação durante busca
  document.getElementById('pagination').style.display = 'none';
}

// Atualiza controles de paginação
function updatePaginationControls() {
  document.getElementById('pagination').style.display = 'flex';
  document.getElementById('prev-page').disabled = currentPage <= 1;
  document.getElementById('next-page').disabled = currentPage >= totalPages;
  document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages}`;
}

// Feedback na tela
function showFeedback(message, type) {
  console.log(`Feedback: ${message} (${type})`);
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
  feedback.style.display = 'block';
  setTimeout(() => {
    feedback.style.display = 'none';
  }, 3000);
}
