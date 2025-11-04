// utils/formatters.js
function formatDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.split(':').slice(0, 2).join(':');
}

function formatAvaliacoes(rows) {
  if (!rows || rows.length === 0) {
    return 'Nenhuma avaliação encontrada. Deseja tentar outra consulta ou voltar ao menu? (Digite "menu" para o menu principal)';
  }
  
  let response = 'Avaliações encontradas:\n\n';
  for (const row of rows) {
    response += `Data: ${formatDate(row.data)}\nDisciplina: ${row.disciplina_nome || 'Sem disciplina'}\nHorário: ${formatTime(row.horario_ini)} - ${formatTime(row.horario_fim)}\nLocal: ${row.laboratorios || 'Sem laboratórios'}\n\n`;
  }
  response += '\nDeseja fazer outra consulta ou voltar ao menu? (Digite "menu" para o menu principal)';
  return response;
}

module.exports = {
  formatDate,
  formatTime,
  formatAvaliacoes,
};
