document.addEventListener('DOMContentLoaded', () => {
  const disciplinaForm = document.getElementById('disciplina-form');
  const disciplinaTableBody = document.getElementById('disciplina-tbody');
  const searchInput = document.getElementById('search');
  const feedback = document.getElementById('feedback');
  const moduloSelect = document.getElementById('modulo_id');
  const professorSelect = document.getElementById('professor_id');

  // Carregar módulos para o select
  async function loadModulos() {
  try {
    console.log('Carregando módulos...');
    const response = await fetch('/api/disciplinas/modulos', { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Erro ao carregar módulos: Status ${response.status}`);
    }
    const modulos = await response.json();
    moduloSelect.innerHTML = '<option value="">Selecione um módulo (opcional)</option>';
    if (modulos.length === 0) {
      showFeedback('Nenhum módulo encontrado no banco de dados.', 'danger');
    }
    modulos.forEach(modulo => {
      const option = document.createElement('option');
      option.value = modulo.id;
      option.textContent = modulo.nome;
      moduloSelect.appendChild(option);
    });
    console.log('Módulos carregados:', modulos);
  } catch (error) {
    console.error('Erro ao carregar módulos:', error);
    showFeedback('Erro ao carregar módulos: ' + error.message, 'danger');
  }
}
  // async function loadModulos() {
  //   try {
  //     console.log('Carregando módulos...');
  //     const response = await fetch('/api/disciplinas/modulos', { credentials: 'include' });
  //     if (!response.ok) {
  //       throw new Error(`Erro ao carregar módulos: Status ${response.status}`);
  //     }
  //     const modulos = await response.json();
  //     moduloSelect.innerHTML = '<option value="">Selecione um módulo (opcional)</option>';
  //     if (modulos.length === 0) {
  //       showFeedback('Nenhum módulo encontrado no banco de dados.', 'danger');
  //     }
  //     modulos.forEach(modulo => {
  //       const option = document.createElement('option');
  //       option.value = modulo.id;
  //       option.textContent = modulo.nome;
  //       moduloSelect.appendChild(option);
  //     });
  //     console.log('Módulos carregados:', modulos);
  //   } catch (error) {
  //     console.error('Erro ao carregar módulos:', error);
  //     showFeedback('Erro ao carregar módulos: ' + error.message, 'danger');
  //   }
  // }

  // Carregar professores para o select
  async function loadProfessores() {
    try {
      console.log('Carregando professores...');
      const response = await fetch('/api/disciplinas/professores', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Erro ao carregar professores: Status ${response.status}`);
      }
      const professores = await response.json();
      professorSelect.innerHTML = '<option value="">Selecione um professor (opcional)</option>';
      if (professores.length === 0) {
        showFeedback('Nenhum professor encontrado no banco de dados.', 'danger');
      }
      professores.forEach(professor => {
        const option = document.createElement('option');
        option.value = professor.id;
        option.textContent = professor.nome;
        professorSelect.appendChild(option);
      });
      console.log('Professores carregados:', professores);
    } catch (error) {
      console.error('Erro ao carregar professores:', error);
      showFeedback('Erro ao carregar professores: ' + error.message, 'danger');
    }
  }

  // Carregar disciplinas
  async function loadDisciplinas() {
    try {
      console.log('Carregando disciplinas...');
      const response = await fetch('/api/disciplinas', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Erro ao carregar disciplinas: Status ${response.status}`);
      }
      const disciplinas = await response.json();
      renderDisciplinas(disciplinas);
      console.log('Disciplinas carregadas:', disciplinas);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
      showFeedback('Erro ao carregar disciplinas: ' + error.message, 'danger');
    }
  }

  // Renderizar disciplinas na tabela
  function renderDisciplinas(disciplinas) {
    disciplinaTableBody.innerHTML = '';
    disciplinas.forEach(disciplina => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><button class="btn btn-sm btn-primary" onclick="editDisciplina(${disciplina.id})"><i class="fas fa-edit"></i></button></td>
        <td>${disciplina.id}</td>
        <td>${disciplina.descricao}</td>
        <td>${disciplina.modulo_nome || 'Nenhum'}</td>
        <td>${disciplina.professor_nome || 'Nenhum'}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteDisciplina(${disciplina.id})"><i class="fas fa-trash"></i></button></td>
      `;
      disciplinaTableBody.appendChild(row);
    });
  }

  // Busca de disciplinas
  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();
    try {
      console.log('Buscando disciplinas com termo:', query);
      const response = await fetch(`/api/disciplinas?search=${encodeURIComponent(query)}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Erro ao buscar disciplinas: Status ${response.status}`);
      }
      const disciplinas = await response.json();
      renderDisciplinas(disciplinas);
      console.log('Disciplinas filtradas:', disciplinas);
    } catch (error) {
      console.error('Erro ao buscar disciplinas:', error);
      showFeedback('Erro ao buscar disciplinas: ' + error.message, 'danger');
    }
  });

  // Submissão do formulário
  disciplinaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Formulário enviado');
    const id = document.getElementById('id').value;
    const descricao = document.getElementById('descricao').value.trim();
    const modulo_id = document.getElementById('modulo_id').value || null;
    const professor_id = document.getElementById('professor_id').value || null;

    const disciplinaObj = { descricao, modulo_id, professor_id };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/disciplinas/${id}` : '/api/disciplinas';

    try {
      console.log('Dados enviados:', disciplinaObj);
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(disciplinaObj),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar disciplina');
      }

      showFeedback(id ? 'Disciplina atualizada com sucesso!' : 'Disciplina criada com sucesso!', 'success');
      clearForm();
      loadDisciplinas();
    } catch (error) {
      console.error('Erro ao salvar disciplina:', error);
      showFeedback(`Erro ao salvar disciplina: ${error.message}`, 'danger');
    }
  });

  // Editar disciplina
  window.editDisciplina = async (id) => {
    try {
      console.log(`Carregando disciplina ${id} para edição`);
      const response = await fetch(`/api/disciplinas/${id}`, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Erro ao carregar disciplina: Status ${response.status}`);
      }
      const disciplina = await response.json();
      document.getElementById('id').value = disciplina.id;
      document.getElementById('descricao').value = disciplina.descricao;
      document.getElementById('modulo_id').value = disciplina.modulo_id || '';
      document.getElementById('professor_id').value = disciplina.professor_id || '';
      showFeedback('Carregando disciplina para edição...', 'info');
    } catch (error) {
      console.error('Erro ao carregar disciplina:', error);
      showFeedback('Erro ao carregar disciplina: ' + error.message, 'danger');
    }
  };

  // Deletar disciplina
  window.deleteDisciplina = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta disciplina?')) return;
    try {
      console.log(`Excluindo disciplina ${id}`);
      const response = await fetch(`/api/disciplinas/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir disciplina');
      }
      showFeedback('Disciplina excluída com sucesso!', 'success');
      loadDisciplinas();
    } catch (error) {
      console.error('Erro ao excluir disciplina:', error);
      showFeedback(`Erro ao excluir disciplina: ${error.message}`, 'danger');
    }
  };

  // Limpar formulário
  window.clearForm = () => {
    console.log('Resetando formulário');
    disciplinaForm.reset();
    document.getElementById('id').value = '';
    document.getElementById('modulo_id').value = '';
    document.getElementById('professor_id').value = '';
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
  loadModulos();
  loadProfessores();
  loadDisciplinas();
});

// document.addEventListener('DOMContentLoaded', () => {
//   const disciplinaForm = document.getElementById('disciplina-form');
//   const disciplinaTableBody = document.getElementById('disciplina-tbody');
//   const searchInput = document.getElementById('search');
//   const feedback = document.getElementById('feedback');
//   const moduloSelect = document.getElementById('modulo_id');
//   const professorSelect = document.getElementById('professor_id');

//   // Carregar módulos para o select
//   async function loadModulos() {
//     try {
//       const response = await fetch('/api/disciplinas/modulos', { credentials: 'include' });
//       if (!response.ok) {
//         if (response.status === 401) {
//           window.location.href = '/login.html';
//           return;
//         }
//         throw new Error(`HTTP ${response.status}`);
//       }
//       const modulos = await response.json();
//       moduloSelect.innerHTML = '<option value="">Selecione um módulo (opcional)</option>';
//       modulos.forEach(modulo => {
//         const option = document.createElement('option');
//         option.value = modulo.id;
//         option.textContent = modulo.nome;
//         moduloSelect.appendChild(option);
//       });
//     } catch (error) {
//       console.error('Erro ao carregar módulos:', error);
//       showFeedback('Erro ao carregar módulos.', 'danger');
//     }
//   }

//   // Carregar professores para o select
//   async function loadProfessores() {
//     try {
//       const response = await fetch('/api/disciplinas/professores', { credentials: 'include' });
//       if (!response.ok) {
//         if (response.status === 401) {
//           window.location.href = '/login.html';
//           return;
//         }
//         throw new Error(`HTTP ${response.status}`);
//       }
//       const professores = await response.json();
//       professorSelect.innerHTML = '<option value="">Selecione um professor (opcional)</option>';
//       professores.forEach(professor => {
//         const option = document.createElement('option');
//         option.value = professor.id;
//         option.textContent = professor.nome;
//         professorSelect.appendChild(option);
//       });
//     } catch (error) {
//       console.error('Erro ao carregar professores:', error);
//       showFeedback('Erro ao carregar professores.', 'danger');
//     }
//   }

//   // Carregar disciplinas
//   async function loadDisciplinas() {
//     try {
//       const response = await fetch('/api/disciplinas', { credentials: 'include' });
//       if (!response.ok) {
//         if (response.status === 401) {
//           window.location.href = '/login.html';
//           return;
//         }
//         throw new Error(`HTTP ${response.status}`);
//       }
//       const disciplinas = await response.json();
//       renderDisciplinas(disciplinas);
//     } catch (error) {
//       console.error('Erro ao carregar disciplinas:', error);
//       showFeedback('Erro ao carregar disciplinas.', 'danger');
//     }
//   }

//   // Renderizar disciplinas na tabela
//   function renderDisciplinas(disciplinas) {
//     disciplinaTableBody.innerHTML = '';
//     disciplinas.forEach(disciplina => {
//       const row = document.createElement('tr');
//       row.innerHTML = `
//         <td><button class="btn btn-sm btn-primary" onclick="editDisciplina(${disciplina.id})"><i class="fas fa-edit"></i></button></td>
//         <td>${disciplina.id}</td>
//         <td>${disciplina.descricao}</td>
//         <td>${disciplina.modulo_nome || 'Nenhum'}</td>
//         <td>${disciplina.professor_nome || 'Nenhum'}</td>
//         <td><button class="btn btn-sm btn-danger" onclick="deleteDisciplina(${disciplina.id})"><i class="fas fa-trash"></i></button></td>
//       `;
//       disciplinaTableBody.appendChild(row);
//     });
//   }

//   // Busca de disciplinas
//   searchInput.addEventListener('input', async () => {
//     const query = searchInput.value.trim();
//     try {
//       const response = await fetch(`/api/disciplinas?search=${encodeURIComponent(query)}`, { credentials: 'include' });
//       if (!response.ok) {
//         if (response.status === 401) {
//           window.location.href = '/login.html';
//           return;
//         }
//         throw new Error(`HTTP ${response.status}`);
//       }
//       const disciplinas = await response.json();
//       renderDisciplinas(disciplinas);
//     } catch (error) {
//       console.error('Erro ao buscar disciplinas:', error);
//       showFeedback('Erro ao buscar disciplinas.', 'danger');
//     }
//   });

//   // Submissão do formulário
//   disciplinaForm.addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const id = document.getElementById('id').value;
//     const descricao = document.getElementById('descricao').value.trim();
//     const modulo_id = document.getElementById('modulo_id').value || null;
//     const professor_id = document.getElementById('professor_id').value || null;

//     const disciplinaObj = { descricao, modulo_id, professor_id };
//     const method = id ? 'PUT' : 'POST';
//     const url = id ? `/api/disciplinas/${id}` : '/api/disciplinas';

//     try {
//       const response = await fetch(url, {
//         method,
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include',
//         body: JSON.stringify(disciplinaObj),
//       });

//       const result = await response.json();
//       if (!response.ok) {
//         if (response.status === 401) {
//           window.location.href = '/login.html';
//           return;
//         }
//         throw new Error(result.error || 'Erro ao salvar disciplina');
//       }

//       showFeedback(id ? 'Disciplina atualizada com sucesso!' : 'Disciplina criada com sucesso!', 'success');
//       clearForm();
//       loadDisciplinas();
//     } catch (error) {
//       console.error('Erro ao salvar disciplina:', error);
//       showFeedback(`Erro: ${error.message}`, 'danger');
//     }
//   });

//   // Editar disciplina
//   window.editDisciplina = async (id) => {
//     try {
//       const response = await fetch(`/api/disciplinas/${id}`, { credentials: 'include' });
//       if (!response.ok) {
//         if (response.status === 401) {
//           window.location.href = '/login.html';
//           return;
//         }
//         throw new Error(`HTTP ${response.status}`);
//       }
//       const disciplina = await response.json();
//       document.getElementById('id').value = disciplina.id;
//       document.getElementById('descricao').value = disciplina.descricao;
//       document.getElementById('modulo_id').value = disciplina.modulo_id || '';
//       document.getElementById('professor_id').value = disciplina.professor_id || '';
//       showFeedback('Editando disciplina...', 'info');
//     } catch (error) {
//       console.error('Erro ao carregar disciplina:', error);
//       showFeedback('Erro ao carregar disciplina.', 'danger');
//     }
//   };

//   // Deletar disciplina
//   window.deleteDisciplina = async (id) => {
//     if (!confirm('Tem certeza que deseja excluir esta disciplina?')) return;
//     try {
//       const response = await fetch(`/api/disciplinas/${id}`, {
//         method: 'DELETE',
//         credentials: 'include',
//       });
//       const result = await response.json();
//       if (!response.ok) {
//         if (response.status === 401) {
//           window.location.href = '/login.html';
//           return;
//         }
//         throw new Error(result.error || 'Erro ao excluir disciplina');
//       }
//       showFeedback('Disciplina excluída com sucesso!', 'success');
//       loadDisciplinas();
//     } catch (error) {
//       console.error('Erro ao excluir disciplina:', error);
//       showFeedback(`Erro: ${error.message}`, 'danger');
//     }
//   };

//   // Limpar formulário
//   window.clearForm = () => {
//     disciplinaForm.reset();
//     document.getElementById('id').value = '';
//     document.getElementById('modulo_id').value = '';
//     document.getElementById('professor_id').value = '';
//     showFeedback('Formulário limpo.', 'info');
//   };

//   // Exibir feedback
//   function showFeedback(message, type) {
//     feedback.textContent = message;
//     feedback.className = `alert alert-${type}`;
//     feedback.style.display = 'block';
//     setTimeout(() => {
//       feedback.style.display = 'none';
//     }, 5000);
//   }

//   // Inicializar
//   loadModulos();
//   loadProfessores();
//   loadDisciplinas();
// });