// Função auxiliar para formatar data no formato dd-mm-aaaa
function formatDate(isoDate) {
  if (!isoDate) return ''; // Retorna vazio se a data for nula ou indefinida
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses são base 0
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Variável para armazenar todas as avaliações carregadas
let allAvaliacoes = [];

document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando consulta pública...');
  loadAvaliacoes();

  // Evento de busca dinâmica
  document.getElementById('search').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    console.log('Termo de busca:', searchTerm);
    filterAvaliacoes(searchTerm);
  });
});

// public/js/main_consulta.js (trecho modificado)
async function loadAvaliacoes() {
  try {
    console.log('Carregando avaliações públicas...');
    const response = await fetch('/api/consulta/public'); // Atualizado
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP! Status: ${response.status} - ${errorText}`);
    }
    allAvaliacoes = await response.json();
    console.log('Avaliações públicas carregadas:', allAvaliacoes);
    renderAvaliacoes(allAvaliacoes);
  } catch (error) {
    console.error('Erro ao carregar avaliações:', error);
    showFeedback('Erro ao carregar avaliações: ' + error.message, 'error');
  }
}

// async function loadAvaliacoes() {
//   try {
//     console.log('Carregando avaliações públicas...');
//     const response = await fetch('/api/avaliacoes/public');
//     if (!response.ok) {
//       throw new Error(`Erro HTTP! Status: ${response.status}`);
//     }
//     allAvaliacoes = await response.json();
//     console.log('Avaliações públicas carregadas:', allAvaliacoes);
//     renderAvaliacoes(allAvaliacoes);
//   } catch (error) {
//     console.error('Erro ao carregar avaliações:', error);
//     showFeedback('Erro ao carregar avaliações: ' + error.message, 'error');
//   }
// }

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
      <td>${ava.laboratorios.map(l => `${l.nome} (Capacidade: ${ava.caip ? l.qtd_com_total : l.qtd_sem_total})`).join(', ')}</td>
    `;
    tbody.appendChild(row);
  });
}

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
}

function showFeedback(message, type) {
  console.log(`Feedback: ${message} (${type})`);
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = type;
  feedback.style.display = 'block';
  setTimeout(() => {
    feedback.style.display = 'none';
  }, 3000);
}