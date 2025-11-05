// public/js/main.js - Refatorado para conformidade com SonarQube
// Refatorado em 2025-11-05

// ===== CONFIGURAÇÃO GLOBAL =====

let currentPage = 1;
let currentSearch = '';
const ITEMS_PER_PAGE = 10;

// ===== DEFINIÇÃO DE COLUNAS =====

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

// ===== UTILITÁRIOS =====

function formatDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = `alert alert-${type} alert-dismissible fade show`;
  feedback.style.display = 'block';
  setTimeout(() => {
    feedback.style.display = 'none';
  }, 3000);
}

// ===== PREFERÊNCIAS DE COLUNAS =====

function loadColumnPreferences() {
  const saved = localStorage.getItem('avaliacao_columnPreferences');
  if (saved) return JSON.parse(saved);
  
  const preferences = {};
  for (const [key, config] of Object.entries(columns)) {
    preferences[key] = config.default;
  }
  return preferences;
}

function saveColumnPreferences(preferences) {
  localStorage.setItem('avaliacao_columnPreferences', JSON.stringify(preferences));
}

function renderColumnToggles() {
  const togglesContainer = document.getElementById('column-toggles');
  const preferences = loadColumnPreferences();
  togglesContainer.innerHTML = '';
  
  for (const [key, { label }] of Object.entries(columns)) {
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
      loadAvaliacoes(currentPage, currentSearch);
    });
  }
}

// ===== API CALLS =====

async function fetchApi(url, options = {}) {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      ...options
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || 'Erro na requisição');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erro na requisição ${url}:`, error);
    throw error;
  }
}

async function loadAvaliacoes(page = 1, search = '') {
  currentPage = page;
  currentSearch = search || '';
  
  try {
    const data = await fetchApi(
      `/api/avaliacoes?page=${page}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(currentSearch)}`
    );
    renderAvaliacoes(data.data);
    renderPagination(data.page, data.totalPages);
  } catch (error) {
    showFeedback(`Erro ao carregar avaliações: ${error.message}`, 'error');
  }
}

// ===== RENDERIZAÇÃO DE TABELA =====

function createTableHeader(preferences) {
  const visibleColumns = Object.entries(columns)
    .filter(([key]) => preferences[key])
    .map(([, { label }]) => `<th>${label}</th>`)
    .join('');
  
  return `<tr>${visibleColumns}</tr>`;
}

function createActionsCell(ava) {
  return `
    <td>
      <button class="btn btn-sm btn-primary" onclick="editAvaliacao(${ava.id})" title="Editar">
        <i class="fas fa-edit"></i>
      </button>
      <div class="form-check form-switch d-inline-block">
        <input class="form-check-input" type="checkbox" id="visivel_${ava.id}" 
               ${ava.visivel ? 'checked' : ''} 
               onchange="toggleVisibilidade(${ava.id}, this.checked)">
        <label class="form-check-label" for="visivel_${ava.id}">
          ${ava.visivel ? 'Visível' : 'Invisível'}
        </label>
      </div>
      <button class="btn btn-sm btn-danger" onclick="toggleDeleteLogico(${ava.id}, true)" title="Deletar">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  `;
}

function createCellContent(key, ava) {
  const cellMap = {
    id: () => ava.id,
    situacao: () => ava.situacao_nome || ava.situacao,
    tipo: () => ava.tipo_nome || ava.tipo,
    data: () => formatDate(ava.data),
    horario: () => ava.horario_ini ? `${ava.horario_ini.slice(0, 5)} - ${ava.horario_fim.slice(0, 5)}` : '',
    qtd_alunos: () => ava.qtd_alunos || '',
    caip: () => ava.caip ? 'Sim' : 'Não',
    modulo: () => ava.modulo_nome || ava.modulo_id || '',
    disciplina: () => ava.disciplina_nome || `Disciplina ${ava.disciplina_id}` || '',
    professor: () => ava.professor_nome || `Professor ${ava.professor_id}` || '',
    qtd_objetiva: () => ava.qtd_objetiva || '',
    qtd_discursiva: () => ava.qtd_discursiva || '',
    laboratorios: () => ava.laboratorios.map(l => `${l.nome} (Capacidade: ${l.qtd_com_total})`).join(', ')
  };
  
  return cellMap[key] ? cellMap[key]() : '';
}

function createTableRow(ava, preferences) {
  let cells = '';
  
  for (const [key] of Object.entries(columns)) {
    if (!preferences[key]) continue;
    
    if (key === 'acoes') {
      cells += createActionsCell(ava);
    } else {
      cells += `<td>${createCellContent(key, ava)}</td>`;
    }
  }
  
  return cells;
}

function renderAvaliacoes(avaliacoes) {
  const thead = document.getElementById('avaliacao-thead');
  const tbody = document.getElementById('avaliacao-tbody');
  const preferences = loadColumnPreferences();
  
  thead.innerHTML = createTableHeader(preferences);
  tbody.innerHTML = '';
  
  if (avaliacoes.length === 0) {
    const colCount = Object.values(preferences).filter(Boolean).length;
    tbody.innerHTML = `<tr><td colspan="${colCount}" class="text-center">Nenhuma avaliação encontrada.</td></tr>`;
    return;
  }
  
  for (const ava of avaliacoes) {
    const row = document.createElement('tr');
    row.innerHTML = createTableRow(ava, preferences);
    tbody.appendChild(row);
  }
}

// ===== PAGINAÇÃO =====

function renderPagination(current, totalPages) {
  const paginationDiv = document.getElementById('paginacao');
  
  const pages = [];
  pages.push(createPaginationButton('Anterior', current - 1, current === 1));
  
  for (let i = 1; i <= totalPages; i++) {
    pages.push(createPaginationButton(i, i, false, current === i));
  }
  
  pages.push(createPaginationButton('Próximo', current + 1, current === totalPages));
  
  paginationDiv.innerHTML = `
    <nav aria-label="Navegação da página">
      <ul class="pagination justify-content-center">${pages.join('')}</ul>
    </nav>
  `;
}

function createPaginationButton(label, page, disabled, active = false) {
  const disabledClass = disabled ? ' disabled' : '';
  const activeClass = active ? ' active' : '';
  return `
    <li class="page-item${disabledClass}${activeClass}">
      <a class="page-link" href="#" onclick="loadAvaliacoes(${page}, currentSearch); return false;">${label}</a>
    </li>
  `;
}

// ===== CRUD OPERATIONS =====

async function toggleVisibilidade(id, visivel) {
  try {
    await fetchApi(`/api/avaliacoes/${id}/visivel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visivel })
    });
    showFeedback('Visibilidade alterada com sucesso!', 'success');
    loadAvaliacoes(currentPage, currentSearch);
  } catch (error) {
    showFeedback(`Erro ao alternar visibilidade: ${error.message}`, 'error');
  }
}

async function toggleDeleteLogico(id, delete_logico) {
  try {
    await fetchApi(`/api/avaliacoes/${id}/delete-logico`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delete_logico })
    });
    showFeedback('Avaliação deletada logicamente com sucesso.', 'success');
    loadAvaliacoes(currentPage, currentSearch);
  } catch (error) {
    showFeedback(`Erro ao deletar logicamente: ${error.message}`, 'error');
  }
}

async function editAvaliacao(id) {
  try {
    const ava = await fetchApi(`/api/avaliacoes/${id}`);
    populateFormWithData(ava);
    await loadLaboratorios();
    selectLaboratorios(ava.laboratorios);
    
    const modal = new bootstrap.Modal(document.getElementById('avaliacaoModal'));
    document.getElementById('avaliacaoModalLabel').textContent = 'Editar Avaliação';
    modal.show();
    showFeedback('Carregando avaliação para edição...', 'success');
  } catch (error) {
    showFeedback(`Erro ao editar: ${error.message}`, 'error');
  }
}

function populateFormWithData(ava) {
  document.getElementById('id').value = ava.id;
  document.getElementById('situacao').value = ava.situacao || '';
  document.getElementById('tipo').value = ava.tipo || '';
  document.getElementById('data').value = ava.data ? ava.data.split('T')[0] : '';
  document.getElementById('horario_ini').value = ava.horario_ini?.slice(0, 5) || '';
  document.getElementById('horario_fim').value = ava.horario_fim?.slice(0, 5) || '';
  document.getElementById('qtd_alunos').value = ava.qtd_alunos || '';
  document.getElementById('caip').checked = ava.caip;
  document.getElementById('modulo_id').value = ava.modulo_id || '';
  document.getElementById('disciplina_id').value = ava.disciplina_id || '';
  document.getElementById('professor_id').value = ava.professor_id || '';
  document.getElementById('qtd_objetiva').value = ava.qtd_objetiva || '';
  document.getElementById('qtd_discursiva').value = ava.qtd_discursiva || '';
}

function selectLaboratorios(laboratorios) {
  const select = document.getElementById('laboratorios');
  for (const option of select.options) {
    option.selected = laboratorios.some(lab => lab.id === Number.parseInt(option.value));
  }
}

// ===== LOAD SELECTS =====

async function loadProfessores() {
  try {
    const professores = await fetchApi('/api/avaliacoes/professores');
    populateSelect('professor_id', professores, 'Selecione o professor');
  } catch (error) {
    showFeedback(`Erro ao carregar professores: ${error.message}`, 'error');
  }
}

async function loadDisciplinas() {
  try {
    const disciplinas = await fetchApi('/api/avaliacoes/disciplinas');
    populateSelect('disciplina_id', disciplinas, 'Selecione a disciplina');
  } catch (error) {
    showFeedback(`Erro ao carregar disciplinas: ${error.message}`, 'error');
  }
}

async function loadModulos() {
  try {
    const modulos = await fetchApi('/api/avaliacoes/modulos');
    populateSelect('modulo_id', modulos, 'Selecione o módulo');
  } catch (error) {
    showFeedback(`Erro ao carregar módulos: ${error.message}`, 'error');
  }
}

async function loadSituacoes() {
  try {
    const situacoes = await fetchApi('/api/avaliacoes/situacoes');
    populateSelect('situacao', situacoes, 'Selecione a situação', 'situacao', 'situacao');
  } catch (error) {
    showFeedback(`Erro ao carregar situações: ${error.message}`, 'error');
  }
}

async function loadTipos() {
  try {
    const tipos = await fetchApi('/api/avaliacoes/tipos');
    populateSelect('tipo', tipos, 'Selecione o tipo', 'tipo', 'tipo');
  } catch (error) {
    showFeedback(`Erro ao carregar tipos: ${error.message}`, 'error');
  }
}

async function loadLaboratorios() {
  try {
    const params = getLaboratorioParams();
    const url = params 
      ? `/api/avaliacoes/available-laboratorios?${params}`
      : '/api/avaliacoes/all-laboratorios';
    
    const laboratorios = await fetchApi(url);
    const caip = document.getElementById('caip').checked;
    
    const select = document.getElementById('laboratorios');
    select.innerHTML = '<option value="">Selecione os laboratórios</option>';
    
    for (const lab of laboratorios) {
      const option = document.createElement('option');
      option.value = lab.id;
      option.text = `${lab.nome} (Capacidade: ${caip ? lab.qtd_com_total : lab.qtd_sem_total})`;
      select.appendChild(option);
    }
  } catch (error) {
    showFeedback(`Erro ao carregar laboratórios: ${error.message}`, 'error');
  }
}

function getLaboratorioParams() {
  const data = document.getElementById('data').value;
  const horario_ini = document.getElementById('horario_ini').value;
  const horario_fim = document.getElementById('horario_fim').value;
  const qtd_alunos = document.getElementById('qtd_alunos').value;
  const caip = document.getElementById('caip').checked;
  
  if (data && horario_ini && horario_fim && qtd_alunos) {
    return `data=${data}&horario_ini=${horario_ini}&horario_fim=${horario_fim}&qtd_alunos=${qtd_alunos}&caip=${caip}`;
  }
  return null;
}

function populateSelect(selectId, items, placeholder, valueKey = 'id', textKey = 'nome') {
  const select = document.getElementById(selectId);
  select.innerHTML = `<option value="">${placeholder}</option>`;
  
  for (const item of items) {
    const option = document.createElement('option');
    option.value = item[valueKey];
    option.text = item[textKey];
    select.appendChild(option);
  }
}

// ===== FORM HANDLING =====

function resetForm() {
  document.getElementById('avaliacao-form').reset();
  document.getElementById('id').value = '';
  document.getElementById('laboratorios').innerHTML = '<option value="">Selecione os laboratórios</option>';
  loadModulos();
  loadProfessores();
  loadDisciplinas();
  loadLaboratorios();
}

async function submitForm(e) {
  e.preventDefault();
  
  const id = document.getElementById('id').value;
  const laboratorios = Array.from(document.getElementById('laboratorios').selectedOptions)
    .map(option => Number.parseInt(option.value));
  
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
    const url = id ? `/api/avaliacoes/${id}` : '/api/avaliacoes';
    const method = id ? 'PUT' : 'POST';
    
    await fetchApi(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    showFeedback(id ? 'Avaliação atualizada com sucesso!' : 'Avaliação criada com sucesso!', 'success');
    const modal = bootstrap.Modal.getInstance(document.getElementById('avaliacaoModal'));
    modal.hide();
    loadAvaliacoes(currentPage, currentSearch);
  } catch (error) {
    showFeedback(`Erro ao salvar avaliação: ${error.message}`, 'error');
  }
}

// ===== EVENT LISTENERS =====

document.addEventListener('DOMContentLoaded', () => {
  renderColumnToggles();
  loadAvaliacoes(currentPage, currentSearch);
  loadProfessores();
  loadDisciplinas();
  loadModulos();
  loadLaboratorios();
  loadSituacoes();
  loadTipos();
  
  // Atualizar laboratórios quando campos relevantes mudarem
  const fieldsToWatch = ['data', 'horario_ini', 'horario_fim', 'qtd_alunos', 'caip'];
  for (const fieldId of fieldsToWatch) {
    document.getElementById(fieldId).addEventListener('change', loadLaboratorios);
  }
  
  // Busca dinâmica
  document.getElementById('search').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    loadAvaliacoes(1, currentSearch);
  });
  
  // Modal events
  document.getElementById('avaliacaoModal').addEventListener('show.bs.modal', (event) => {
    if (event.relatedTarget?.classList.contains('btn-primary')) {
      resetForm();
      document.getElementById('avaliacaoModalLabel').textContent = 'Adicionar Avaliação';
    }
  });
  
  document.getElementById('avaliacaoModal').addEventListener('hidden.bs.modal', resetForm);
  document.getElementById('avaliacao-form').addEventListener('submit', submitForm);
});
