document.addEventListener('DOMContentLoaded', () => {
    const professorForm = document.getElementById('professor-form');
    const professorTableBody = document.getElementById('professor-tbody');
    const searchInput = document.getElementById('search');
    const feedback = document.getElementById('feedback');
  
    // Carregar professores
    async function loadProfessors() {
      try {
        const response = await fetch('/api/professores', { credentials: 'include' });
        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = '/login.html';
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        const professores = await response.json();
        renderProfessors(professores);
      } catch (error) {
        console.error('Erro ao carregar professores:', error);
        showFeedback('Erro ao carregar professores.', 'danger');
      }
    }
  
    // Renderizar professores na tabela
    function renderProfessors(professores) {
      professorTableBody.innerHTML = '';
      professores.forEach(professor => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><button class="btn btn-sm btn-primary" onclick="editProfessor(${professor.id})"><i class="fas fa-edit"></i></button></td>
          <td>${professor.id}</td>
          <td>${professor.nome}</td>
          <td><button class="btn btn-sm btn-danger" onclick="deleteProfessor(${professor.id})"><i class="fas fa-trash"></i></button></td>
        `;
        professorTableBody.appendChild(row);
      });
    }
  
    // Busca de professores
    searchInput.addEventListener('input', async () => {
      const query = searchInput.value.trim();
      try {
        const response = await fetch(`/api/professores?search=${encodeURIComponent(query)}`, { credentials: 'include' });
        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = '/login.html';
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        const professores = await response.json();
        renderProfessors(professores);
      } catch (error) {
        console.error('Erro ao buscar professores:', error);
        showFeedback('Erro ao buscar professores.', 'danger');
      }
    });
  
    // Submissão do formulário
    professorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('id').value;
      const nome = document.getElementById('nome').value.trim();
  
      const professor = { nome };
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/professores/${id}` : '/api/professores';
  
      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(professor),
        });
  
        const result = await response.json();
        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = '/login.html';
            return;
          }
          throw new Error(result.error || 'Erro ao salvar professor');
        }
  
        showFeedback(id ? 'Professor atualizado com sucesso!' : 'Professor criado com sucesso!', 'success');
        clearForm();
        loadProfessors();
      } catch (error) {
        console.error('Erro ao salvar professor:', error);
        showFeedback(`Erro: ${error.message}`, 'danger');
      }
    });
  
    // Editar professor
    window.editProfessor = async (id) => {
      try {
        const response = await fetch(`/api/professores/${id}`, { credentials: 'include' });
        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = '/login.html';
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        const professor = await response.json();
        document.getElementById('id').value = professor.id;
        document.getElementById('nome').value = professor.nome;
        showFeedback('Editando professor...', 'info');
      } catch (error) {
        console.error('Erro ao carregar professor:', error);
        showFeedback('Erro ao carregar professor.', 'danger');
      }
    };
  
    // Deletar professor
    window.deleteProfessor = async (id) => {
      if (!confirm('Tem certeza que deseja excluir este professor?')) return;
      try {
        const response = await fetch(`/api/professores/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const result = await response.json();
        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = '/login.html';
            return;
          }
          throw new Error(result.error || 'Erro ao excluir professor');
        }
        showFeedback('Professor excluído com sucesso!', 'success');
        loadProfessors();
      } catch (error) {
        console.error('Erro ao excluir professor:', error);
        showFeedback(`Erro: ${error.message}`, 'danger');
      }
    };
  
    // Limpar formulário
    window.clearForm = () => {
      professorForm.reset();
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
    loadProfessors();
  });