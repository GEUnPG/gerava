// main.js para gerenciamento de avaliações com paginação e busca dinâmica
//refatorado em 2024-06-10
// --- Configuração global da paginação ---
let currentPage = 1;
let currentSearch = '';
const limit = 10;

// Função auxiliar para formatar data no formato dd-mm-aaaa
function formatDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Definição das colunas disponíveis
const columns = {
  acoes: { label: 'Ações', default: true },
  id: { label: 'ID', default: true },
  situacao: { label: 'Situação', default: true },
  tipo: { label: 'Tipo', default: true },
  data: { label: 'Data', default: true },
  horario: { label: 'Horário', default: true },
  qtd_alunos: { label: 'Alunos', default: true },
  caip: { label: 'CAIP', default: true },
  modulo: { label: 'Módulo', default: true },
  disciplina: { label: 'Disciplina', default: true },
  professor: { label: 'Professor', default: true },
  qtd_objetiva: { label: 'Objetivas', default: false },
  qtd_discursiva: { label: 'Discursivas', default: false },
  laboratorios: { label: 'Laboratórios', default: true }
};

// --- Colunas dinâmicas ---
function renderColumnToggles() {
  const togglesContainer = document.getElementById('column-toggles');
  const preferences = loadColumnPreferences();
  togglesContainer.innerHTML = '';
  Object.entries(columns).forEach(([key, { label }]) => {
    const li = document.createElement('li');
    li.className = 'dropdown-item';
    li.innerHTML = `
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" id="toggle-${key}" ${preferences[key] ? 'checked' : ''}>
        <label class="form-check-label" for="toggle-${key}">${label}</label>
      </div>
    `;
    togglesContainer.appendChild(li);
    document.getElementById(`toggle-${key}`).addEventListener('change', (e) => {
      preferences[key] = e.target.checked;
      saveColumnPreferences(preferences);
      loadAvaliacoes(currentPage, currentSearch); // Atualiza visualização da página atual
    });
  });
}

function loadColumnPreferences() {
  const saved = localStorage.getItem('avaliacao_columnPreferences');
  if (saved) return JSON.parse(saved);
  const preferences = {};
  Object.keys(columns).forEach(key => {
    preferences[key] = columns[key].default;
  });
  return preferences;
}

function saveColumnPreferences(preferences) {
  localStorage.setItem('avaliacao_columnPreferences', JSON.stringify(preferences));
}

// --- Eventos de página ---
document.addEventListener('DOMContentLoaded', () => {
  renderColumnToggles();
  loadAvaliacoes(currentPage, currentSearch);
  loadProfessores();
  loadDisciplinas();
  loadModulos();
  loadLaboratorios();
  loadSituacoes();
  loadTipos();

  ['data', 'horario_ini', 'horario_fim', 'qtd_alunos', 'caip'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      loadLaboratorios();
    });
  });

  // Busca dinâmica
  document.getElementById('search').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    loadAvaliacoes(1, currentSearch); // Sempre volta à página 1 para nova busca
  });

  document.getElementById('avaliacaoModal').addEventListener('show.bs.modal', (event) => {
    if (event.relatedTarget.classList.contains('btn-primary')) {
      document.getElementById('avaliacao-form').reset();
      document.getElementById('id').value = '';
      document.getElementById('laboratorios').innerHTML = '<option value="">Selecione os laboratórios</option>';
      document.getElementById('avaliacaoModalLabel').textContent = 'Adicionar Avaliação';
      loadModulos();
      loadProfessores();
      loadDisciplinas();
      loadLaboratorios();
    }
  });

  document.getElementById('avaliacaoModal').addEventListener('hidden.bs.modal', resetForm);

  document.getElementById('avaliacao-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('id').value;
    const laboratorios = Array.from(document.getElementById('laboratorios').selectedOptions).map(option => Number.parseInt(option.value));
    const data = {
      situacao: document.getElementById('situacao').value,
      tipo: document.getElementById('tipo').value,
      data: document.getElementById('data').value,
      horario_ini: document.getElementById('horario_ini').value,
      horario_fim: document.getElementById('horario_fim').value,
      qtd_alunos: Number.parseInt(document.getElementById('qtd_alunos').value) || null,
      caip: document.getElementById('caip').checked,
      modulo_id: Number.parseInt(document.getElementById('modulo_id').value) || null,
      disciplina_id: Number.parseInt(document.getElementById('disciplina_id').value) || null,
      professor_id: Number.parseInt(document.getElementById('professor_id').value) || null,
      qtd_objetiva: Number.parseInt(document.getElementById('qtd_objetiva').value) || null,
      qtd_discursiva: Number.parseInt(document.getElementById('qtd_discursiva').value) || null,
      laboratorios
    };
    try {
      const response = id
        ? await fetch(`/api/avaliacoes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
          })
        : await fetch('/api/avaliacoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
          });
      const result = await response.json();
      if (response.ok) {
        showFeedback(id ? 'Avaliação atualizada com sucesso!' : 'Avaliação criada com sucesso!', 'success');
        const modal = bootstrap.Modal.getInstance(document.getElementById('avaliacaoModal'));
        modal.hide();
        loadAvaliacoes(currentPage, currentSearch);
      } else {
        showFeedback(result.details || result.error || 'Erro ao salvar avaliação.', 'error');
      }
    } catch (error) {
      showFeedback('Erro ao salvar avaliação: ' + error.message, 'error');
    }
  });
});

// --- Busca paginada na API ---
function loadAvaliacoes(page = 1, search = '') {
  currentPage = page;
  currentSearch = search || '';
  fetch(`/api/avaliacoes?page=${page}&limit=${limit}&search=${encodeURIComponent(currentSearch)}`, { credentials: 'include' })
    .then(resp => resp.json())
    .then(data => {
      renderAvaliacoes(data.data); // corrigido
      renderPagination(data.page, data.totalPages);  // corrigido
    });
}

// --- Renderizar páginação Bootstrap ---
function renderPagination(current, totalPages) {
  const paginationDiv = document.getElementById('paginacao');
  let html = `<nav aria-label="Navegação da página"><ul class="pagination justify-content-center">`;

  html += `<li class="page-item${current === 1 ? ' disabled' : ''}">
    <a class="page-link" href="#" onclick="loadAvaliacoes(${current-1}, currentSearch); return false;">Anterior</a></li>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item${current === i ? ' active' : ''}">
      <a class="page-link" href="#" onclick="loadAvaliacoes(${i}, currentSearch); return false;">${i}</a></li>`;
  }
  html += `<li class="page-item${current === totalPages ? ' disabled' : ''}">
    <a class="page-link" href="#" onclick="loadAvaliacoes(${current+1}, currentSearch); return false;">Próximo</a></li>`;

  html += `</ul></nav>`;
  paginationDiv.innerHTML = html;
}

// --- Renderizar tabela de avaliações ---
function renderAvaliacoes(avaliacoes) {
  const thead = document.getElementById('avaliacao-thead');
  const tbody = document.getElementById('avaliacao-tbody');
  const preferences = loadColumnPreferences();

  // Cabeçalho dinâmico
  thead.innerHTML = '<tr>' + Object.entries(columns)
    .filter(([key]) => preferences[key])
    .map(([key, { label }]) => `<th>${label}</th>`)
    .join('') + '</tr>';

  tbody.innerHTML = '';
  if (avaliacoes.length === 0) {
    const colCount = Object.values(preferences).filter(v => v).length;
    tbody.innerHTML = `<tr><td colspan="${colCount}" class="text-center">Nenhuma avaliação encontrada.</td></tr>`;
    return;
  }

  avaliacoes.forEach(ava => {
    const row = document.createElement('tr');
    let cells = '';
    if (preferences.acoes) {
      cells += `
        <td>
          <button class="btn btn-sm btn-primary" onclick="editAvaliacao(${ava.id})" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <div class="form-check form-switch d-inline-block">
            <input class="form-check-input" type="checkbox" id="visivel_${ava.id}" ${ava.visivel ? 'checked' : ''} onchange="toggleVisibilidade(${ava.id}, this.checked)">
            <label class="form-check-label" for="visivel_${ava.id}">${ava.visivel ? 'Visível' : 'Invisível'}</label>
          </div>
          <button class="btn btn-sm btn-danger" onclick="toggleDeleteLogico(${ava.id}, true)" title="Deletar">
            <i class="fas fa-trash"></i>
          </button>
        </td>`;
    }
    if (preferences.id) cells += `<td>${ava.id}</td>`;
    if (preferences.situacao) cells += `<td>${ava.situacao_nome || ava.situacao}</td>`;
    if (preferences.tipo) cells += `<td>${ava.tipo_nome || ava.tipo}</td>`;
    if (preferences.data) cells += `<td>${formatDate(ava.data)}</td>`;
    if (preferences.horario) cells += `<td>${ava.horario_ini ? `${ava.horario_ini.slice(0, 5)} - ${ava.horario_fim.slice(0, 5)}` : ''}</td>`;
    if (preferences.qtd_alunos) cells += `<td>${ava.qtd_alunos || ''}</td>`;
    if (preferences.caip) cells += `<td>${ava.caip ? 'Sim' : 'Não'}</td>`;
    if (preferences.modulo) cells += `<td>${ava.modulo_nome || ava.modulo_id || ''}</td>`;
    if (preferences.disciplina) cells += `<td>${ava.disciplina_nome || 'Disciplina ' + ava.disciplina_id || ''}</td>`;
    if (preferences.professor) cells += `<td>${ava.professor_nome || 'Professor ' + ava.professor_id || ''}</td>`;
    if (preferences.qtd_objetiva) cells += `<td>${ava.qtd_objetiva || ''}</td>`;
    if (preferences.qtd_discursiva) cells += `<td>${ava.qtd_discursiva || ''}</td>`;
    if (preferences.laboratorios) cells += `<td>${ava.laboratorios.map(l => `${l.nome} (Capacidade: ${l.qtd_com_total})`).join(', ')}</td>`;
    row.innerHTML = cells;
    tbody.appendChild(row);
  });
}

// --- CRUD e utilitários ---
async function toggleVisibilidade(id, visivel) {
  try {
    const response = await fetch(`/api/avaliacoes/${id}/visivel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visivel }),
      credentials: 'include'
    });
    const result = await response.json();
    if (response.ok) {
      showFeedback(result.message, 'success');
      loadAvaliacoes(currentPage, currentSearch);
    } else {
      showFeedback(result.error || 'Erro ao alternar visibilidade.', 'error');
    }
  } catch (error) {
    showFeedback('Erro ao alternar visibilidade: ' + error.message, 'error');
  }
}

async function toggleDeleteLogico(id, delete_logico) {
  try {
    const response = await fetch(`/api/avaliacoes/${id}/delete-logico`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delete_logico }),
      credentials: 'include'
    });
    const result = await response.json();
    if (response.ok) {
      showFeedback('Avaliação deletada logicamente com sucesso.', 'success');
      loadAvaliacoes(currentPage, currentSearch);
    } else {
      showFeedback(result.error || 'Erro ao deletar logicamente.', 'error');
    }
  } catch (error) {
    showFeedback('Erro ao deletar logicamente: ' + error.message, 'error');
  }
}

async function editAvaliacao(id) {
  try {
    const response = await fetch(`/api/avaliacoes/${id}`, { credentials: 'include' });
    if (!response.ok) throw new Error('Erro ao buscar avaliação');
    const ava = await response.json();
    document.getElementById('id').value = ava.id;
    document.getElementById('situacao').value = ava.situacao || '';
    document.getElementById('tipo').value = ava.tipo || '';
    document.getElementById('data').value = ava.data ? ava.data.split('T')[0] : '';
    document.getElementById('horario_ini').value = ava.horario_ini ? ava.horario_ini.slice(0, 5) : '';
    document.getElementById('horario_fim').value = ava.horario_fim ? ava.horario_fim.slice(0, 5) : '';
    document.getElementById('qtd_alunos').value = ava.qtd_alunos || '';
    document.getElementById('caip').checked = ava.caip;
    document.getElementById('modulo_id').value = ava.modulo_id || '';
    document.getElementById('disciplina_id').value = ava.disciplina_id || '';
    document.getElementById('professor_id').value = ava.professor_id || '';
    document.getElementById('qtd_objetiva').value = ava.qtd_objetiva || '';
    document.getElementById('qtd_discursiva').value = ava.qtd_discursiva || '';
    await loadLaboratorios();
    const select = document.getElementById('laboratorios');
    Array.from(select.options).forEach(option => {
      option.selected = ava.laboratorios.some(lab => lab.id === Number.parseInt(option.value));
    });
    const modal = new bootstrap.Modal(document.getElementById('avaliacaoModal'));
    document.getElementById('avaliacaoModalLabel').textContent = 'Editar Avaliação';
    modal.show();
    showFeedback('Carregando avaliação para edição...', 'success');
  } catch (error) {
    showFeedback('Erro ao editar: ' + error.message, 'error');
  }
}

// --- Carregamento dos selects de apoio ---
async function loadProfessores() {
  try {
    const response = await fetch('/api/avaliacoes/professores', { credentials: 'include' });
    if (!response.ok) throw new Error('Erro ao carregar professores');
    const professores = await response.json();
    const select = document.getElementById('professor_id');
    select.innerHTML = '<option value="">Selecione o professor</option>';
    professores.forEach(prof => {
      const option = document.createElement('option');
      option.value = prof.id;
      option.text = prof.nome;
      select.appendChild(option);
    });
  } catch (error) {
    showFeedback('Erro ao carregar professores: ' + error.message, 'error');
  }
}

async function loadDisciplinas() {
  try {
    const response = await fetch('/api/avaliacoes/disciplinas', { credentials: 'include' });
    if (!response.ok) throw new Error('Erro ao carregar disciplinas');
    const disciplinas = await response.json();
    const select = document.getElementById('disciplina_id');
    select.innerHTML = '<option value="">Selecione a disciplina</option>';
    disciplinas.forEach(disc => {
      const option = document.createElement('option');
      option.value = disc.id;
      option.text = disc.nome;
      select.appendChild(option);
    });
  } catch (error) {
    showFeedback('Erro ao carregar disciplinas: ' + error.message, 'error');
  }
}

async function loadModulos() {
  try {
    const response = await fetch('/api/avaliacoes/modulos', { credentials: 'include' });
    if (!response.ok) throw new Error('Erro ao carregar módulos');
    const modulos = await response.json();
    const select = document.getElementById('modulo_id');
    select.innerHTML = '<option value="">Selecione o módulo</option>';
    modulos.forEach(mod => {
      const option = document.createElement('option');
      option.value = mod.id;
      option.text = mod.nome;
      select.appendChild(option);
    });
  } catch (error) {
    showFeedback('Erro ao carregar módulos: ' + error.message, 'error');
  }
}

async function loadLaboratorios() {
  try {
    const data = document.getElementById('data').value;
    const horario_ini = document.getElementById('horario_ini').value;
    const horario_fim = document.getElementById('horario_fim').value;
    const qtd_alunos = document.getElementById('qtd_alunos').value;
    const caip = document.getElementById('caip').checked;
    const select = document.getElementById('laboratorios');
    select.innerHTML = '<option value="">Selecione os laboratórios</option>';

    let laboratorios = [];
    if (data && horario_ini && horario_fim && qtd_alunos) {
      const response = await fetch(`/api/avaliacoes/available-laboratorios?data=${data}&horario_ini=${horario_ini}&horario_fim=${horario_fim}&qtd_alunos=${qtd_alunos}&caip=${caip}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao buscar laboratórios disponíveis');
      laboratorios = await response.json();
    } else {
      const response = await fetch('/api/avaliacoes/all-laboratorios', { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao buscar todos os laboratórios');
      laboratorios = await response.json();
    }
    laboratorios.forEach(lab => {
      const option = document.createElement('option');
      option.value = lab.id;
      option.text = `${lab.nome} (Capacidade: ${caip ? lab.qtd_com_total : lab.qtd_sem_total})`;
      select.appendChild(option);
    });
  } catch (error) {
    showFeedback('Erro ao carregar laboratórios: ' + error.message, 'error');
  }
}

async function loadSituacoes() {
  try {
    const response = await fetch('/api/avaliacoes/situacoes', { credentials: 'include' });
    if (!response.ok) throw new Error('Erro ao carregar situações');
    const situacoes = await response.json();
    const select = document.getElementById('situacao');
    select.innerHTML = '<option value="">Selecione a situação</option>';
    situacoes.forEach(sit => {
      const option = document.createElement('option');
      option.value = sit.situacao;
      option.text = sit.situacao;
      select.appendChild(option);
    });
  } catch (error) {
    showFeedback('Erro ao carregar situações: ' + error.message, 'error');
  }
}

async function loadTipos() {
  try {
    const response = await fetch('/api/avaliacoes/tipos', { credentials: 'include' });
    if (!response.ok) throw new Error('Erro ao carregar tipos');
    const tipos = await response.json();
    const select = document.getElementById('tipo');
    select.innerHTML = '<option value="">Selecione o tipo</option>';
    tipos.forEach(tipo => {
      const option = document.createElement('option');
      option.value = tipo.tipo;
      option.text = tipo.tipo;
      select.appendChild(option);
    });
  } catch (error) {
    showFeedback('Erro ao carregar tipos: ' + error.message, 'error');
  }
}

// Resetar formulário
function resetForm() {
  document.getElementById('avaliacao-form').reset();
  document.getElementById('id').value = '';
  document.getElementById('laboratorios').innerHTML = '<option value="">Selecione os laboratórios</option>';
  loadModulos();
  loadProfessores();
  loadDisciplinas();
  loadLaboratorios();
}

// Feedback visual
function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = `alert alert-${type} alert-dismissible fade show`;
  feedback.style.display = 'block';
  setTimeout(() => {
    feedback.style.display = 'none';
  }, 3000);
}
