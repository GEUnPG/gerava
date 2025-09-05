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

// Gerar switches de colunas no dropdown
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
      renderAvaliacoes(allAvaliacoes);
    });
  });
}

// Carregar preferências de colunas do localStorage ou usar padrões
function loadColumnPreferences() {
  const saved = localStorage.getItem('avaliacao_columnPreferences');
  if (saved) {
    return JSON.parse(saved);
  }
  const preferences = {};
  Object.keys(columns).forEach(key => {
    preferences[key] = columns[key].default;
  });
  return preferences;
}

// Salvar preferências de colunas no localStorage
function saveColumnPreferences(preferences) {
  localStorage.setItem('avaliacao_columnPreferences', JSON.stringify(preferences));
}

// Função para carregar situações
async function loadSituacoes() {
  try {
    console.log('Carregando situações...');
    const response = await fetch('/api/avaliacoes/situacoes', { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Erro ao carregar situações: Status ${response.status}`);
    }
    const situacoes = await response.json();
    const select = document.getElementById('situacao');
    select.innerHTML = '<option value="">Selecione a situação</option>';
    if (situacoes.length === 0) {
      showFeedback('Nenhuma situação encontrada no banco de dados.', 'error');
    }
    situacoes.forEach(sit => {
      const option = document.createElement('option');
      option.value = sit.situacao;
      option.text = sit.situacao;
      select.appendChild(option);
    });
    console.log('Situações carregadas:', situacoes);
  } catch (error) {
    console.error('Erro ao carregar situações:', error);
    showFeedback('Erro ao carregar situações: ' + error.message, 'error');
  }
}

// Função para carregar tipos
async function loadTipos() {
  try {
    console.log('Carregando tipos...');
    const response = await fetch('/api/avaliacoes/tipos', { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Erro ao carregar tipos: Status ${response.status}`);
    }
    const tipos = await response.json();
    const select = document.getElementById('tipo');
    select.innerHTML = '<option value="">Selecione o tipo</option>';
    if (tipos.length === 0) {
      showFeedback('Nenhum tipo encontrado no banco de dados.', 'error');
    }
    tipos.forEach(tipo => {
      const option = document.createElement('option');
      option.value = tipo.tipo;
      option.text = tipo.tipo;
      select.appendChild(option);
    });
    console.log('Tipos carregados:', tipos);
  } catch (error) {
    console.error('Erro ao carregar tipos:', error);
    showFeedback('Erro ao carregar tipos: ' + error.message, 'error');
  }
}

// Variável para armazenar todas as avaliações carregadas
let allAvaliacoes = [];

document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando aplicação...');
  renderColumnToggles();
  loadAvaliacoes();
  loadProfessores();
  loadDisciplinas();
  loadModulos();
  loadLaboratorios();
  loadSituacoes();
  loadTipos();

  ['data', 'horario_ini', 'horario_fim', 'qtd_alunos', 'caip'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      console.log(`Campo ${id} alterado, atualizando laboratórios...`);
      loadLaboratorios();
    });
  });

  document.getElementById('search').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    console.log('Termo de busca:', searchTerm);
    filterAvaliacoes(searchTerm);
  });

  // Resetar formulário quando o modal for aberto para "Adicionar Avaliação"
  document.getElementById('avaliacaoModal').addEventListener('show.bs.modal', (event) => {
    if (event.relatedTarget.classList.contains('btn-primary')) {
      console.log('Modal aberto para adicionar avaliação');
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

  // Resetar formulário quando o modal for fechado
  document.getElementById('avaliacaoModal').addEventListener('hidden.bs.modal', () => {
    console.log('Modal fechado, resetando formulário');
    resetForm();
  });

  document.getElementById('avaliacao-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Formulário enviado');
    const id = document.getElementById('id').value;
    const laboratorios = Array.from(document.getElementById('laboratorios').selectedOptions).map(option => parseInt(option.value));
    const data = {
      situacao: document.getElementById('situacao').value,
      tipo: document.getElementById('tipo').value,
      data: document.getElementById('data').value,
      horario_ini: document.getElementById('horario_ini').value,
      horario_fim: document.getElementById('horario_fim').value,
      qtd_alunos: parseInt(document.getElementById('qtd_alunos').value) || null,
      caip: document.getElementById('caip').checked,
      modulo_id: parseInt(document.getElementById('modulo_id').value) || null,
      disciplina_id: parseInt(document.getElementById('disciplina_id').value) || null,
      professor_id: parseInt(document.getElementById('professor_id').value) || null,
      qtd_objetiva: parseInt(document.getElementById('qtd_objetiva').value) || null,
      qtd_discursiva: parseInt(document.getElementById('qtd_discursiva').value) || null,
      laboratorios
    };

    try {
      console.log('Dados enviados:', data);
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
        loadAvaliacoes();
      } else {
        showFeedback(result.details || result.error || 'Erro ao salvar avaliação.', 'error');
      }
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      showFeedback('Erro ao salvar avaliação: ' + error.message, 'error');
    }
  });
});

async function loadAvaliacoes() {
  try {
    console.log('Carregando avaliações...');
    const response = await fetch('/api/avaliacoes', { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Erro HTTP! Status: ${response.status}`);
    }
    allAvaliacoes = await response.json();
    console.log('Avaliações carregadas:', allAvaliacoes);
    renderAvaliacoes(allAvaliacoes);
  } catch (error) {
    console.error('Erro ao carregar avaliações:', error);
    showFeedback('Erro ao carregar avaliações: ' + error.message, 'error');
  }
}

function renderAvaliacoes(avaliacoes) {
  const thead = document.getElementById('avaliacao-thead');
  const tbody = document.getElementById('avaliacao-tbody');
  const preferences = loadColumnPreferences();

  // Gerar cabeçalho dinâmico
  thead.innerHTML = '<tr>' + Object.entries(columns)
    .filter(([key]) => preferences[key])
    .map(([key, { label }]) => `<th>${label}</th>`)
    .join('') + '</tr>';

  // Limpar corpo da tabela
  tbody.innerHTML = '';
  if (avaliacoes.length === 0) {
    const colCount = Object.values(preferences).filter(v => v).length;
    tbody.innerHTML = `<tr><td colspan="${colCount}" class="text-center">Nenhuma avaliação encontrada.</td></tr>`;
    return;
  }

  // Renderizar linhas
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

async function toggleVisibilidade(id, visivel) {
  try {
    console.log(`Alternando visibilidade da avaliação ${id} para ${visivel}`);
    const response = await fetch(`/api/avaliacoes/${id}/visivel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visivel }),
      credentials: 'include'
    });
    const result = await response.json();
    if (response.ok) {
      showFeedback(result.message, 'success');
      loadAvaliacoes();
    } else {
      showFeedback(result.error || 'Erro ao alternar visibilidade.', 'error');
    }
  } catch (error) {
    console.error('Erro ao alternar visibilidade:', error);
    showFeedback('Erro ao alternar visibilidade: ' + error.message, 'error');
  }
}

async function toggleDeleteLogico(id, delete_logico) {
  try {
    console.log(`Alternando deleção lógica da avaliação ${id} para ${delete_logico}`);
    const response = await fetch(`/api/avaliacoes/${id}/delete-logico`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delete_logico }),
      credentials: 'include'
    });
    const result = await response.json();
    if (response.ok) {
      showFeedback('Avaliação deletada logicamente com sucesso.', 'success');
      loadAvaliacoes();
    } else {
      showFeedback(result.error || 'Erro ao deletar logicamente.', 'error');
    }
  } catch (error) {
    console.error('Erro ao alternar deleção lógica:', error);
    showFeedback('Erro ao deletar logicamente: ' + error.message, 'error');
  }
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

async function editAvaliacao(id) {
  try {
    console.log(`Carregando avaliação ${id} para edição`);
    const response = await fetch(`/api/avaliacoes/${id}`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Erro HTTP! Status: ${response.status}`);
    }
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
      option.selected = ava.laboratorios.some(lab => lab.id === parseInt(option.value));
    });

    // Abrir o modal e alterar o título
    const modal = new bootstrap.Modal(document.getElementById('avaliacaoModal'));
    document.getElementById('avaliacaoModalLabel').textContent = 'Editar Avaliação';
    modal.show();
    console.log('Modal de edição aberto');

    showFeedback('Carregando avaliação para edição...', 'success');
  } catch (error) {
    console.error('Erro ao editar avaliação:', error);
    showFeedback('Erro ao editar: ' + error.message, 'error');
  }
}

async function loadProfessores() {
  try {
    console.log('Carregando professores...');
    const response = await fetch('/api/avaliacoes/professores', { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Erro ao carregar professores: Status ${response.status}`);
    }
    const professores = await response.json();
    const select = document.getElementById('professor_id');
    select.innerHTML = '<option value="">Selecione o professor</option>';
    if (professores.length === 0) {
      showFeedback('Nenhum professor encontrado no banco de dados.', 'error');
    }
    professores.forEach(prof => {
      const option = document.createElement('option');
      option.value = prof.id;
      option.text = prof.nome;
      select.appendChild(option);
    });
    console.log('Professores carregados:', professores);
  } catch (error) {
    console.error('Erro ao carregar professores:', error);
    showFeedback('Erro ao carregar professores: ' + error.message, 'error');
  }
}

async function loadDisciplinas() {
  try {
    console.log('Carregando disciplinas...');
    const response = await fetch('/api/avaliacoes/disciplinas', { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Erro ao carregar disciplinas: Status ${response.status}`);
    }
    const disciplinas = await response.json();
    const select = document.getElementById('disciplina_id');
    select.innerHTML = '<option value="">Selecione a disciplina</option>';
    if (disciplinas.length === 0) {
      showFeedback('Nenhuma disciplina encontrada no banco de dados.', 'error');
    }
    disciplinas.forEach(disc => {
      const option = document.createElement('option');
      option.value = disc.id;
      option.text = disc.nome;
      select.appendChild(option);
    });
    console.log('Disciplinas carregadas:', disciplinas);
  } catch (error) {
    console.error('Erro ao carregar disciplinas:', error);
    showFeedback('Erro ao carregar disciplinas: ' + error.message, 'error');
  }
}

async function loadModulos() {
  try {
    console.log('Carregando módulos...');
    const response = await fetch('/api/avaliacoes/modulos', { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Erro ao carregar módulos: Status ${response.status}`);
    }
    const modulos = await response.json();
    const select = document.getElementById('modulo_id');
    select.innerHTML = '<option value="">Selecione o módulo</option>';
    if (modulos.length === 0) {
      showFeedback('Nenhum módulo encontrado no banco de dados.', 'error');
    }
    modulos.forEach(mod => {
      const option = document.createElement('option');
      option.value = mod.id;
      option.text = mod.nome;
      select.appendChild(option);
    });
    console.log('Módulos carregados:', modulos);
  } catch (error) {
    console.error('Erro ao carregar módulos:', error);
    showFeedback('Erro ao carregar módulos: ' + error.message, 'error');
  }
}

async function loadLaboratorios() {
  try {
    console.log('Carregando laboratórios disponíveis...');
    const data = document.getElementById('data').value;
    const horario_ini = document.getElementById('horario_ini').value;
    const horario_fim = document.getElementById('horario_fim').value;
    const qtd_alunos = document.getElementById('qtd_alunos').value;
    const caip = document.getElementById('caip').checked;

    const select = document.getElementById('laboratorios');
    select.innerHTML = '<option value="">Selecione os laboratórios</option>';

    if (data && horario_ini && horario_fim && qtd_alunos) {
      console.log('Buscando laboratórios disponíveis com filtros:', { data, horario_ini, horario_fim, qtd_alunos, caip });
      const response = await fetch(`/api/avaliacoes/available-laboratorios?data=${data}&horario_ini=${horario_ini}&horario_fim=${horario_fim}&qtd_alunos=${qtd_alunos}&caip=${caip}`, { credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro HTTP! Status: ${response.status}, Detalhes: ${errorData.error}`);
      }
      const laboratorios = await response.json();
      if (laboratorios.length === 0) {
        showFeedback('Nenhum conjunto de laboratórios disponível para os critérios selecionados.', 'error');
      }
      laboratorios.forEach(lab => {
        const option = document.createElement('option');
        option.value = lab.id;
        option.text = `${lab.nome} (Capacidade: ${caip ? lab.qtd_com_total : lab.qtd_sem_total})`;
        select.appendChild(option);
      });
      console.log('Conjuntos de laboratórios disponíveis carregados:', laboratorios);
    } else {
      console.log('Campos incompletos, carregando todos os laboratórios');
      const response = await fetch('/api/avaliacoes/all-laboratorios', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Erro HTTP! Status: ${response.status}`);
      }
      const laboratorios = await response.json();
      if (laboratorios.length === 0) {
        showFeedback('Nenhum conjunto de laboratórios encontrado no banco de dados.', 'error');
      }
      laboratorios.forEach(lab => {
        const option = document.createElement('option');
        option.value = lab.id;
        option.text = `${lab.nome} (Capacidade: ${caip ? lab.qtd_com_total : lab.qtd_sem_total})`;
        select.appendChild(option);
      });
      console.log('Todos os conjuntos de laboratórios carregados:', laboratorios);
    }
  } catch (error) {
    console.error('Erro ao carregar laboratórios:', error);
    showFeedback('Erro ao carregar laboratórios: ' + error.message, 'error');
  }
}

function resetForm() {
  console.log('Resetando formulário');
  document.getElementById('avaliacao-form').reset();
  document.getElementById('id').value = '';
  document.getElementById('laboratorios').innerHTML = '<option value="">Selecione os laboratórios</option>';
  loadModulos();
  loadProfessores();
  loadDisciplinas();
  loadLaboratorios();
}

function showFeedback(message, type) {
  console.log(`Feedback: ${message} (${type})`);
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = `alert alert-${type} alert-dismissible fade show`;
  feedback.style.display = 'block';
  setTimeout(() => {
    feedback.style.display = 'none';
  }, 3000);
}

// // Função auxiliar para formatar data no formato dd-mm-aaaa
// function formatDate(isoDate) {
//   if (!isoDate) return '';
//   const date = new Date(isoDate);
//   const day = String(date.getDate()).padStart(2, '0');
//   const month = String(date.getMonth() + 1).padStart(2, '0');
//   const year = date.getFullYear();
//   return `${day}-${month}-${year}`;
// }

// // Definição das colunas disponíveis
// const columns = {
//   acoes: { label: 'Ações', default: true },
//   id: { label: 'ID', default: true },
//   situacao: { label: 'Situação', default: true },
//   tipo: { label: 'Tipo', default: true },
//   data: { label: 'Data', default: true },
//   horario: { label: 'Horário', default: true },
//   qtd_alunos: { label: 'Alunos', default: true },
//   caip: { label: 'CAIP', default: true },
//   modulo: { label: 'Módulo', default: true },
//   disciplina: { label: 'Disciplina', default: true },
//   professor: { label: 'Professor', default: true },
//   qtd_objetiva: { label: 'Objetivas', default: false },
//   qtd_discursiva: { label: 'Discursivas', default: false },
//   laboratorios: { label: 'Laboratórios', default: true }
// };

// // Gerar switches de colunas no dropdown
// function renderColumnToggles() {
//   const togglesContainer = document.getElementById('column-toggles');
//   const preferences = loadColumnPreferences();
//   togglesContainer.innerHTML = '';
//   Object.entries(columns).forEach(([key, { label }]) => {
//     const li = document.createElement('li');
//     li.className = 'dropdown-item';
//     li.innerHTML = `
//       <div class="form-check form-switch">
//         <input class="form-check-input" type="checkbox" id="toggle-${key}" ${preferences[key] ? 'checked' : ''}>
//         <label class="form-check-label" for="toggle-${key}">${label}</label>
//       </div>
//     `;
//     togglesContainer.appendChild(li);
//     document.getElementById(`toggle-${key}`).addEventListener('change', (e) => {
//       preferences[key] = e.target.checked;
//       saveColumnPreferences(preferences);
//       renderAvaliacoes(allAvaliacoes);
//     });
//   });
// }

// // Carregar preferências de colunas do localStorage ou usar padrões
// function loadColumnPreferences() {
//   const saved = localStorage.getItem('avaliacao_columnPreferences');
//   if (saved) {
//     return JSON.parse(saved);
//   }
//   const preferences = {};
//   Object.keys(columns).forEach(key => {
//     preferences[key] = columns[key].default;
//   });
//   return preferences;
// }

// // Salvar preferências de colunas no localStorage
// function saveColumnPreferences(preferences) {
//   localStorage.setItem('avaliacao_columnPreferences', JSON.stringify(preferences));
// }

// // Gerar switches de colunas no dropdown
// function renderColumnToggles() {
//   const togglesContainer = document.getElementById('column-toggles');
//   const preferences = loadColumnPreferences();
//   togglesContainer.innerHTML = '';
//   Object.entries(columns).forEach(([key, { label }]) => {
//     const li = document.createElement('li');
//     li.className = 'dropdown-item';
//     li.innerHTML = `
//       <div class="form-check form-switch">
//         <input class="form-check-input" type="checkbox" id="toggle-${key}" ${preferences[key] ? 'checked' : ''}>
//         <label class="form-check-label" for="toggle-${key}">${label}</label>
//       </div>
//     `;
//     togglesContainer.appendChild(li);
//     document.getElementById(`toggle-${key}`).addEventListener('change', (e) => {
//       preferences[key] = e.target.checked;
//       saveColumnPreferences(preferences);
//       renderAvaliacoes(allAvaliacoes);
//     });
//   });
// }

// // Função para carregar situações
// async function loadSituacoes() {
//   try {
//     console.log('Carregando situações...');
//     const response = await fetch('/api/avaliacoes/situacoes', { credentials: 'include' });
//     if (!response.ok) {
//       throw new Error(`Erro ao carregar situações: Status ${response.status}`);
//     }
//     const situacoes = await response.json();
//     const select = document.getElementById('situacao');
//     select.innerHTML = '<option value="">Selecione a situação</option>';
//     if (situacoes.length === 0) {
//       showFeedback('Nenhuma situação encontrada no banco de dados.', 'error');
//     }
//     situacoes.forEach(sit => {
//       const option = document.createElement('option');
//       option.value = sit.situacao;
//       option.text = sit.situacao;
//       select.appendChild(option);
//     });
//     console.log('Situações carregadas:', situacoes);
//   } catch (error) {
//     console.error('Erro ao carregar situações:', error);
//     showFeedback('Erro ao carregar situações: ' + error.message, 'error');
//   }
// }

// // Função para carregar tipos
// async function loadTipos() {
//   try {
//     console.log('Carregando tipos...');
//     const response = await fetch('/api/avaliacoes/tipos', { credentials: 'include' });
//     if (!response.ok) {
//       throw new Error(`Erro ao carregar tipos: Status ${response.status}`);
//     }
//     const tipos = await response.json();
//     const select = document.getElementById('tipo');
//     select.innerHTML = '<option value="">Selecione o tipo</option>';
//     if (tipos.length === 0) {
//       showFeedback('Nenhum tipo encontrado no banco de dados.', 'error');
//     }
//     tipos.forEach(tipo => {
//       const option = document.createElement('option');
//       option.value = tipo.tipo;
//       option.text = tipo.tipo;
//       select.appendChild(option);
//     });
//     console.log('Tipos carregados:', tipos);
//   } catch (error) {
//     console.error('Erro ao carregar tipos:', error);
//     showFeedback('Erro ao carregar tipos: ' + error.message, 'error');
//   }
// }

// // Variável para armazenar todas as avaliações carregadas
// let allAvaliacoes = [];

// document.addEventListener('DOMContentLoaded', () => {
//   console.log('Inicializando aplicação...');
//   renderColumnToggles();
//   loadAvaliacoes();
//   loadProfessores();
//   loadDisciplinas();
//   loadModulos();
//   loadLaboratorios();
//   loadSituacoes();
//   loadTipos();

//   ['data', 'horario_ini', 'horario_fim', 'qtd_alunos', 'caip'].forEach(id => {
//     document.getElementById(id).addEventListener('change', () => {
//       console.log(`Campo ${id} alterado, atualizando laboratórios...`);
//       loadLaboratorios();
//     });
//   });

//   document.getElementById('search').addEventListener('input', (e) => {
//     const searchTerm = e.target.value.toLowerCase();
//     console.log('Termo de busca:', searchTerm);
//     filterAvaliacoes(searchTerm);
//   });

//   // Associar o botão "Adicionar Avaliação" à função de abrir o modal
//   document.querySelector('[data-bs-target="#avaliacaoModal"]').addEventListener('click', openAddAvaliacaoModal);

//   document.getElementById('avaliacao-form').addEventListener('submit', async (e) => {
//     e.preventDefault();
//     console.log('Formulário enviado');
//     const id = document.getElementById('id').value;
//     const laboratorios = Array.from(document.getElementById('laboratorios').selectedOptions).map(option => parseInt(option.value));
//     const data = {
//       situacao: document.getElementById('situacao').value,
//       tipo: document.getElementById('tipo').value,
//       data: document.getElementById('data').value,
//       horario_ini: document.getElementById('horario_ini').value,
//       horario_fim: document.getElementById('horario_fim').value,
//       qtd_alunos: parseInt(document.getElementById('qtd_alunos').value) || null,
//       caip: document.getElementById('caip').checked,
//       modulo_id: parseInt(document.getElementById('modulo_id').value) || null,
//       disciplina_id: parseInt(document.getElementById('disciplina_id').value) || null,
//       professor_id: parseInt(document.getElementById('professor_id').value) || null,
//       qtd_objetiva: parseInt(document.getElementById('qtd_objetiva').value) || null,
//       qtd_discursiva: parseInt(document.getElementById('qtd_discursiva').value) || null,
//       laboratorios
//     };

//     try {
//       console.log('Dados enviados:', data);
//       const response = id
//         ? await fetch(`/api/avaliacoes/${id}`, {
//             method: 'PUT',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(data),
//             credentials: 'include'
//           })
//         : await fetch('/api/avaliacoes', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(data),
//             credentials: 'include'
//           });

//       const result = await response.json();
//       if (response.ok) {
//         showFeedback(id ? 'Avaliação atualizada com sucesso!' : 'Avaliação criada com sucesso!', 'success');
//         resetForm();
//         const modal = bootstrap.Modal.getInstance(document.getElementById('avaliacaoModal'));
//         modal.hide();
//         loadAvaliacoes();
//       } else {
//         showFeedback(result.details || result.error || 'Erro ao salvar avaliação.', 'error');
//       }
//     } catch (error) {
//       console.error('Erro ao salvar avaliação:', error);
//       showFeedback('Erro ao salvar avaliação: ' + error.message, 'error');
//     }
//   });
// });

// // document.addEventListener('DOMContentLoaded', () => {
// //   console.log('Inicializando aplicação...');
// //   renderColumnToggles();
// //   loadAvaliacoes();
// //   loadProfessores();
// //   loadDisciplinas();
// //   loadModulos();
// //   loadLaboratorios();
// //   loadSituacoes();
// //   loadTipos();

// //   ['data', 'horario_ini', 'horario_fim', 'qtd_alunos', 'caip'].forEach(id => {
// //     document.getElementById(id).addEventListener('change', () => {
// //       console.log(`Campo ${id} alterado, atualizando laboratórios...`);
// //       loadLaboratorios();
// //     });
// //   });

// //   document.getElementById('search').addEventListener('input', (e) => {
// //     const searchTerm = e.target.value.toLowerCase();
// //     console.log('Termo de busca:', searchTerm);
// //     filterAvaliacoes(searchTerm);
// //   });

// //   document.getElementById('avaliacao-form').addEventListener('submit', async (e) => {
// //     e.preventDefault();
// //     console.log('Formulário enviado');
// //     const id = document.getElementById('id').value;
// //     const laboratorios = Array.from(document.getElementById('laboratorios').selectedOptions).map(option => parseInt(option.value));
// //     const data = {
// //       situacao: document.getElementById('situacao').value,
// //       tipo: document.getElementById('tipo').value,
// //       data: document.getElementById('data').value,
// //       horario_ini: document.getElementById('horario_ini').value,
// //       horario_fim: document.getElementById('horario_fim').value,
// //       qtd_alunos: parseInt(document.getElementById('qtd_alunos').value) || null,
// //       caip: document.getElementById('caip').checked,
// //       modulo_id: parseInt(document.getElementById('modulo_id').value) || null,
// //       disciplina_id: parseInt(document.getElementById('disciplina_id').value) || null,
// //       professor_id: parseInt(document.getElementById('professor_id').value) || null,
// //       qtd_objetiva: parseInt(document.getElementById('qtd_objetiva').value) || null,
// //       qtd_discursiva: parseInt(document.getElementById('qtd_discursiva').value) || null,
// //       laboratorios
// //     };

// //     try {
// //       console.log('Dados enviados:', data);
// //       const response = id
// //         ? await fetch(`/api/avaliacoes/${id}`, {
// //             method: 'PUT',
// //             headers: { 'Content-Type': 'application/json' },
// //             body: JSON.stringify(data),
// //             credentials: 'include'
// //           })
// //         : await fetch('/api/avaliacoes', {
// //             method: 'POST',
// //             headers: { 'Content-Type': 'application/json' },
// //             body: JSON.stringify(data),
// //             credentials: 'include'
// //           });

// //       const result = await response.json();
// //       if (response.ok) {
// //         showFeedback(id ? 'Avaliação atualizada com sucesso!' : 'Avaliação criada com sucesso!', 'success');
// //         resetForm();
// //         loadAvaliacoes();
// //       } else {
// //         showFeedback(result.details || result.error || 'Erro ao salvar avaliação.', 'error');
// //       }
// //     } catch (error) {
// //       console.error('Erro ao salvar avaliação:', error);
// //       showFeedback('Erro ao salvar avaliação: ' + error.message, 'error');
// //     }
// //   });
// // });

// async function loadAvaliacoes() {
//   try {
//     console.log('Carregando avaliações...');
//     const response = await fetch('/api/avaliacoes', { credentials: 'include' });
//     if (!response.ok) {
//       throw new Error(`Erro HTTP! Status: ${response.status}`);
//     }
//     allAvaliacoes = await response.json();
//     console.log('Avaliações carregadas:', allAvaliacoes);
//     renderAvaliacoes(allAvaliacoes);
//   } catch (error) {
//     console.error('Erro ao carregar avaliações:', error);
//     showFeedback('Erro ao carregar avaliações: ' + error.message, 'error');
//   }
// }

// function renderAvaliacoes(avaliacoes) {
//   const thead = document.getElementById('avaliacao-thead');
//   const tbody = document.getElementById('avaliacao-tbody');
//   const preferences = loadColumnPreferences();

//   // Gerar cabeçalho dinâmico
//   thead.innerHTML = '<tr>' + Object.entries(columns)
//     .filter(([key]) => preferences[key])
//     .map(([key, { label }]) => `<th>${label}</th>`)
//     .join('') + '</tr>';

//   // Limpar corpo da tabela
//   tbody.innerHTML = '';
//   if (avaliacoes.length === 0) {
//     const colCount = Object.values(preferences).filter(v => v).length;
//     tbody.innerHTML = `<tr><td colspan="${colCount}" class="text-center">Nenhuma avaliação encontrada.</td></tr>`;
//     return;
//   }

//   // Renderizar linhas
//   avaliacoes.forEach(ava => {
//     const row = document.createElement('tr');
//     let cells = '';
//     if (preferences.acoes) {
//       cells += `
//         <td>
//           <button class="btn btn-sm btn-primary" onclick="editAvaliacao(${ava.id})" title="Editar">
//             <i class="fas fa-edit"></i>
//           </button>
//           <div class="form-check form-switch d-inline-block">
//             <input class="form-check-input" type="checkbox" id="visivel_${ava.id}" ${ava.visivel ? 'checked' : ''} onchange="toggleVisibilidade(${ava.id}, this.checked)">
//             <label class="form-check-label" for="visivel_${ava.id}">${ava.visivel ? 'Visível' : 'Invisível'}</label>
//           </div>
//           <button class="btn btn-sm btn-danger" onclick="toggleDeleteLogico(${ava.id}, true)" title="Deletar">
//             <i class="fas fa-trash"></i>
//           </button>
//         </td>`;
//     }
//     if (preferences.id) cells += `<td>${ava.id}</td>`;
//     if (preferences.situacao) cells += `<td>${ava.situacao_nome || ava.situacao}</td>`;
//     if (preferences.tipo) cells += `<td>${ava.tipo_nome || ava.tipo}</td>`;
//     if (preferences.data) cells += `<td>${formatDate(ava.data)}</td>`;
//     if (preferences.horario) cells += `<td>${ava.horario_ini ? `${ava.horario_ini.slice(0, 5)} - ${ava.horario_fim.slice(0, 5)}` : ''}</td>`;
//     if (preferences.qtd_alunos) cells += `<td>${ava.qtd_alunos || ''}</td>`;
//     if (preferences.caip) cells += `<td>${ava.caip ? 'Sim' : 'Não'}</td>`;
//     if (preferences.modulo) cells += `<td>${ava.modulo_nome || ava.modulo_id || ''}</td>`;
//     if (preferences.disciplina) cells += `<td>${ava.disciplina_nome || 'Disciplina ' + ava.disciplina_id || ''}</td>`;
//     if (preferences.professor) cells += `<td>${ava.professor_nome || 'Professor ' + ava.professor_id || ''}</td>`;
//     if (preferences.qtd_objetiva) cells += `<td>${ava.qtd_objetiva || ''}</td>`;
//     if (preferences.qtd_discursiva) cells += `<td>${ava.qtd_discursiva || ''}</td>`;
//     if (preferences.laboratorios) cells += `<td>${ava.laboratorios.map(l => `${l.nome} (Capacidade: ${l.qtd_com_total})`).join(', ')}</td>`;
//     row.innerHTML = cells;
//     tbody.appendChild(row);
//   });
// }

// async function toggleVisibilidade(id, visivel) {
//   try {
//     console.log(`Alternando visibilidade da avaliação ${id} para ${visivel}`);
//     const response = await fetch(`/api/avaliacoes/${id}/visivel`, {
//       method: 'PATCH',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ visivel }),
//       credentials: 'include'
//     });
//     const result = await response.json();
//     if (response.ok) {
//       showFeedback(result.message, 'success');
//       loadAvaliacoes();
//     } else {
//       showFeedback(result.error || 'Erro ao alternar visibilidade.', 'error');
//     }
//   } catch (error) {
//     console.error('Erro ao alternar visibilidade:', error);
//     showFeedback('Erro ao alternar visibilidade: ' + error.message, 'error');
//   }
// }

// async function toggleDeleteLogico(id, delete_logico) {
//   try {
//     console.log(`Alternando deleção lógica da avaliação ${id} para ${delete_logico}`);
//     const response = await fetch(`/api/avaliacoes/${id}/delete-logico`, {
//       method: 'PATCH',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ delete_logico }),
//       credentials: 'include'
//     });
//     const result = await response.json();
//     if (response.ok) {
//       showFeedback('Avaliação deletada logicamente com sucesso.', 'success');
//       loadAvaliacoes();
//     } else {
//       showFeedback(result.error || 'Erro ao deletar logicamente.', 'error');
//     }
//   } catch (error) {
//     console.error('Erro ao alternar deleção lógica:', error);
//     showFeedback('Erro ao deletar logicamente: ' + error.message, 'error');
//   }
// }

// function filterAvaliacoes(searchTerm) {
//   const filteredAvaliacoes = allAvaliacoes.filter(ava => {
//     const data = formatDate(ava.data).toLowerCase();
//     const modulo = (ava.modulo_nome || '').toLowerCase();
//     const professor = (ava.professor_nome || '').toLowerCase();
//     const horario = ava.horario_ini ? `${ava.horario_ini.slice(0, 5)} - ${ava.horario_fim.slice(0, 5)}`.toLowerCase() : '';
//     return (
//       data.includes(searchTerm) ||
//       modulo.includes(searchTerm) ||
//       professor.includes(searchTerm) ||
//       horario.includes(searchTerm)
//     );
//   });
//   console.log('Avaliações filtradas:', filteredAvaliacoes);
//   renderAvaliacoes(filteredAvaliacoes);
// }

// async function editAvaliacao(id) {
//   try {
//     console.log(`Carregando avaliação ${id} para edição`);
//     const response = await fetch(`/api/avaliacoes/${id}`, { credentials: 'include' });
//     if (!response.ok) {
//       throw new Error(`Erro HTTP! Status: ${response.status}`);
//     }
//     const ava = await response.json();
//     document.getElementById('id').value = ava.id;
//     document.getElementById('situacao').value = ava.situacao || '';
//     document.getElementById('tipo').value = ava.tipo || '';
//     document.getElementById('data').value = ava.data ? ava.data.split('T')[0] : '';
//     document.getElementById('horario_ini').value = ava.horario_ini ? ava.horario_ini.slice(0, 5) : '';
//     document.getElementById('horario_fim').value = ava.horario_fim ? ava.horario_fim.slice(0, 5) : '';
//     document.getElementById('qtd_alunos').value = ava.qtd_alunos || '';
//     document.getElementById('caip').checked = ava.caip;
//     document.getElementById('modulo_id').value = ava.modulo_id || '';
//     document.getElementById('disciplina_id').value = ava.disciplina_id || '';
//     document.getElementById('professor_id').value = ava.professor_id || '';
//     document.getElementById('qtd_objetiva').value = ava.qtd_objetiva || '';
//     document.getElementById('qtd_discursiva').value = ava.qtd_discursiva || '';

//     await loadLaboratorios();

//     const select = document.getElementById('laboratorios');
//     Array.from(select.options).forEach(option => {
//       option.selected = ava.laboratorios.some(lab => lab.id === parseInt(option.value));
//     });

//     // Abrir o modal e alterar o título
//     const modal = new bootstrap.Modal(document.getElementById('avaliacaoModal'));
//     document.getElementById('avaliacaoModalLabel').textContent = 'Editar Avaliação';
//     modal.show();

//     showFeedback('Carregando avaliação para edição...', 'success');
//   } catch (error) {
//     console.error('Erro ao editar avaliação:', error);
//     showFeedback('Erro ao editar: ' + error.message, 'error');
//   }
// }

// // função para abrir o modal
// function openAddAvaliacaoModal() {
//   console.log('Abrindo modal para adicionar avaliação');
//   // Limpar o formulário sem chamar funções assíncronas
//   document.getElementById('avaliacao-form').reset();
//   document.getElementById('id').value = '';
//   document.getElementById('laboratorios').innerHTML = '<option value="">Selecione os laboratórios</option>';
//   document.getElementById('avaliacaoModalLabel').textContent = 'Adicionar Avaliação';
  
//   // Abrir o modal
//   const modal = new bootstrap.Modal(document.getElementById('avaliacaoModal'), {
//     backdrop: true, // Garante que o backdrop seja criado
//     keyboard: true // Permite fechar com a tecla Esc
//   });
//   modal.show();
  
//   // Carregar opções dos selects após abrir o modal
//   loadModulos();
//   loadProfessores();
//   loadDisciplinas();
//   loadLaboratorios();
// }

// // function openAddAvaliacaoModal() {
// //   resetForm();
// //   const modal = new bootstrap.Modal(document.getElementById('avaliacaoModal'));
// //   document.getElementById('avaliacaoModalLabel').textContent = 'Adicionar Avaliação';
// //   modal.show();
// // }

// // async function editAvaliacao(id) {
// //   try {
// //     console.log(`Carregando avaliação ${id} para edição`);
// //     const response = await fetch(`/api/avaliacoes/${id}`, { credentials: 'include' });
// //     if (!response.ok) {
// //       throw new Error(`Erro HTTP! Status: ${response.status}`);
// //     }
// //     const ava = await response.json();
// //     document.getElementById('id').value = ava.id;
// //     document.getElementById('situacao').value = ava.situacao || '';
// //     document.getElementById('tipo').value = ava.tipo || '';
// //     document.getElementById('data').value = ava.data ? ava.data.split('T')[0] : '';
// //     document.getElementById('horario_ini').value = ava.horario_ini ? ava.horario_ini.slice(0, 5) : '';
// //     document.getElementById('horario_fim').value = ava.horario_fim ? ava.horario_fim.slice(0, 5) : '';
// //     document.getElementById('qtd_alunos').value = ava.qtd_alunos || '';
// //     document.getElementById('caip').checked = ava.caip;
// //     document.getElementById('modulo_id').value = ava.modulo_id || '';
// //     document.getElementById('disciplina_id').value = ava.disciplina_id || '';
// //     document.getElementById('professor_id').value = ava.professor_id || '';
// //     document.getElementById('qtd_objetiva').value = ava.qtd_objetiva || '';
// //     document.getElementById('qtd_discursiva').value = ava.qtd_discursiva || '';

// //     await loadLaboratorios();

// //     const select = document.getElementById('laboratorios');
// //     Array.from(select.options).forEach(option => {
// //       option.selected = ava.laboratorios.some(lab => lab.id === parseInt(option.value));
// //     });

// //     showFeedback('Carregando avaliação para edição...', 'success');
// //   } catch (error) {
// //     console.error('Erro ao editar avaliação:', error);
// //     showFeedback('Erro ao editar: ' + error.message, 'error');
// //   }
// // }

// async function loadProfessores() {
//   try {
//     console.log('Carregando professores...');
//     const response = await fetch('/api/avaliacoes/professores', { credentials: 'include' });
//     if (!response.ok) {
//       throw new Error(`Erro ao carregar professores: Status ${response.status}`);
//     }
//     const professores = await response.json();
//     const select = document.getElementById('professor_id');
//     select.innerHTML = '<option value="">Selecione o professor</option>';
//     if (professores.length === 0) {
//       showFeedback('Nenhum professor encontrado no banco de dados.', 'error');
//     }
//     professores.forEach(prof => {
//       const option = document.createElement('option');
//       option.value = prof.id;
//       option.text = prof.nome;
//       select.appendChild(option);
//     });
//     console.log('Professores carregados:', professores);
//   } catch (error) {
//     console.error('Erro ao carregar professores:', error);
//     showFeedback('Erro ao carregar professores: ' + error.message, 'error');
//   }
// }

// async function loadDisciplinas() {
//   try {
//     console.log('Carregando disciplinas...');
//     const response = await fetch('/api/avaliacoes/disciplinas', { credentials: 'include' });
//     if (!response.ok) {
//       throw new Error(`Erro ao carregar disciplinas: Status ${response.status}`);
//     }
//     const disciplinas = await response.json();
//     const select = document.getElementById('disciplina_id');
//     select.innerHTML = '<option value="">Selecione a disciplina</option>';
//     if (disciplinas.length === 0) {
//       showFeedback('Nenhuma disciplina encontrada no banco de dados.', 'error');
//     }
//     disciplinas.forEach(disc => {
//       const option = document.createElement('option');
//       option.value = disc.id;
//       option.text = disc.nome;
//       select.appendChild(option);
//     });
//     console.log('Disciplinas carregadas:', disciplinas);
//   } catch (error) {
//     console.error('Erro ao carregar disciplinas:', error);
//     showFeedback('Erro ao carregar disciplinas: ' + error.message, 'error');
//   }
// }

// async function loadModulos() {
//   try {
//     console.log('Carregando módulos...');
//     const response = await fetch('/api/avaliacoes/modulos', { credentials: 'include' });
//     if (!response.ok) {
//       throw new Error(`Erro ao carregar módulos: Status ${response.status}`);
//     }
//     const modulos = await response.json();
//     const select = document.getElementById('modulo_id');
//     select.innerHTML = '<option value="">Selecione o módulo</option>';
//     if (modulos.length === 0) {
//       showFeedback('Nenhum módulo encontrado no banco de dados.', 'error');
//     }
//     modulos.forEach(mod => {
//       const option = document.createElement('option');
//       option.value = mod.id;
//       option.text = mod.nome;
//       select.appendChild(option);
//     });
//     console.log('Módulos carregados:', modulos);
//   } catch (error) {
//     console.error('Erro ao carregar módulos:', error);
//     showFeedback('Erro ao carregar módulos: ' + error.message, 'error');
//   }
// }

// async function loadLaboratorios() {
//   try {
//     console.log('Carregando laboratórios disponíveis...');
//     const data = document.getElementById('data').value;
//     const horario_ini = document.getElementById('horario_ini').value;
//     const horario_fim = document.getElementById('horario_fim').value;
//     const qtd_alunos = document.getElementById('qtd_alunos').value;
//     const caip = document.getElementById('caip').checked;

//     const select = document.getElementById('laboratorios');
//     select.innerHTML = '<option value="">Selecione os laboratórios</option>';

//     if (data && horario_ini && horario_fim && qtd_alunos) {
//       console.log('Buscando laboratórios disponíveis com filtros:', { data, horario_ini, horario_fim, qtd_alunos, caip });
//       const response = await fetch(`/api/avaliacoes/available-laboratorios?data=${data}&horario_ini=${horario_ini}&horario_fim=${horario_fim}&qtd_alunos=${qtd_alunos}&caip=${caip}`, { credentials: 'include' });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(`Erro HTTP! Status: ${response.status}, Detalhes: ${errorData.error}`);
//       }
//       const laboratorios = await response.json();
//       if (laboratorios.length === 0) {
//         showFeedback('Nenhum conjunto de laboratórios disponível para os critérios selecionados.', 'error');
//       }
//       laboratorios.forEach(lab => {
//         const option = document.createElement('option');
//         option.value = lab.id;
//         option.text = `${lab.nome} (Capacidade: ${caip ? lab.qtd_com_total : lab.qtd_sem_total})`;
//         select.appendChild(option);
//       });
//       console.log('Conjuntos de laboratórios disponíveis carregados:', laboratorios);
//     } else {
//       console.log('Campos incompletos, carregando todos os laboratórios');
//       const response = await fetch('/api/avaliacoes/all-laboratorios', { credentials: 'include' });
//       if (!response.ok) {
//         throw new Error(`Erro HTTP! Status: ${response.status}`);
//       }
//       const laboratorios = await response.json();
//       if (laboratorios.length === 0) {
//         showFeedback('Nenhum conjunto de laboratórios encontrado no banco de dados.', 'error');
//       }
//       laboratorios.forEach(lab => {
//         const option = document.createElement('option');
//         option.value = lab.id;
//         option.text = `${lab.nome} (Capacidade: ${caip ? lab.qtd_com_total : lab.qtd_sem_total})`;
//         select.appendChild(option);
//       });
//       console.log('Todos os conjuntos de laboratórios carregados:', laboratorios);
//     }
//   } catch (error) {
//     console.error('Erro ao carregar laboratórios:', error);
//     showFeedback('Erro ao carregar laboratórios: ' + error.message, 'error');
//   }
// }

// function resetForm() {
//   console.log('Resetando formulário');
//   document.getElementById('avaliacao-form').reset();
//   document.getElementById('id').value = '';
//   document.getElementById('laboratorios').innerHTML = '<option value="">Selecione os laboratórios</option>';
//   loadModulos();
//   loadProfessores();
//   loadDisciplinas();
//   loadLaboratorios();
// }

// function showFeedback(message, type) {
//   console.log(`Feedback: ${message} (${type})`);
//   const feedback = document.getElementById('feedback');
//   feedback.textContent = message;
//   feedback.className = `alert alert-${type} alert-dismissible fade show`;
//   feedback.style.display = 'block';
//   setTimeout(() => {
//     feedback.style.display = 'none';
//   }, 3000);
// }