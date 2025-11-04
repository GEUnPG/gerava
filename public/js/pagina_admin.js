// refatorado em 2024-06-10
// Paginação para a tabela de tentativas
        (function() {
            const tbody = document.getElementById('attempts-body');
            const perPageSelect = document.getElementById('attemptsPerPage');
            const paginationList = document.getElementById('attemptsPagination');
            const pageInfo = document.getElementById('attemptsPageInfo');

            let allRows = []; // armazenará nós <tr>
            let currentPage = 1;
            let perPage = Number.parseInt(perPageSelect.value, 10);

            function collectRows() {
                // coletar linha por linha (clonar para não perder original quando escondemos)
                const rows = Array.from(tbody.querySelectorAll('tr'));
                allRows = rows.map(r => r.cloneNode(true));
            }

            function renderPage(page = 1) {
                perPage = Number.parseInt(perPageSelect.value, 10) || 10;
                const total = allRows.length;
                const totalPages = Math.max(1, Math.ceil(total / perPage));
                currentPage = Math.min(Math.max(1, page), totalPages);

                // limpar tbody
                tbody.innerHTML = '';

                // renderizar slice
                const start = (currentPage - 1) * perPage;
                const end = start + perPage;
                const slice = allRows.slice(start, end);
                slice.forEach(r => tbody.appendChild(r.cloneNode(true)));

                renderPaginationControls(totalPages);
                updateInfo(total, start + 1, Math.min(end, total));
            }

            function renderPaginationControls(totalPages) {
                paginationList.innerHTML = '';

                // Prev
                const prevLi = document.createElement('li');
                prevLi.className = 'page-item ' + (currentPage === 1 ? 'disabled' : '');
                prevLi.innerHTML = '<button class="page-link">Anterior</button>';
                prevLi.addEventListener('click', () => {
                    if (currentPage > 1) renderPage(currentPage - 1);
                });
                paginationList.appendChild(prevLi);

                // páginas (limitar exibição se muitas páginas)
                const maxButtons = 7;
                let startPage = 1;
                let endPage = totalPages;
                if (totalPages > maxButtons) {
                    const mid = Math.floor(maxButtons / 2);
                    startPage = Math.max(1, currentPage - mid);
                    endPage = startPage + maxButtons - 1;
                    if (endPage > totalPages) {
                        endPage = totalPages;
                        startPage = endPage - maxButtons + 1;
                    }
                }
                for (let i = startPage; i <= endPage; i++) {
                    const li = document.createElement('li');
                    li.className = 'page-item ' + (i === currentPage ? 'active' : '');
                    li.innerHTML = `<button class="page-link">${i}</button>`;
                    li.addEventListener('click', () => renderPage(i));
                    paginationList.appendChild(li);
                }

                // Next
                const nextLi = document.createElement('li');
                nextLi.className = 'page-item ' + (currentPage === totalPages ? 'disabled' : '');
                nextLi.innerHTML = '<button class="page-link">Próximo</button>';
                nextLi.addEventListener('click', () => {
                    if (currentPage < totalPages) renderPage(currentPage + 1);
                });
                paginationList.appendChild(nextLi);
            }

            function updateInfo(total, from, to) {
                if (total === 0) {
                    pageInfo.textContent = 'Nenhuma tentativa encontrada';
                } else {
                    pageInfo.textContent = `Mostrando ${from}-${to} de ${total}`;
                }
            }

            // Inicializa quando houver mudanças no tbody (para suportar carregamento via admin.js)
            let initTimer = null;
            function initPagination(resetPage = true) {
                // adiar para permitir que admin.js finalize alterações rápidas
                if (initTimer) clearTimeout(initTimer);
                initTimer = setTimeout(() => {
                    collectRows();
                    const prevTotal = allRows.length;
                    if (resetPage) currentPage = 1;
                    renderPage(currentPage);
                }, 100); // 100ms debounce
            }

            // Observador para reinicializar paginação quando admin.js atualizar a tabela
            const observer = new MutationObserver(() => initPagination(false));
            observer.observe(tbody, { childList: true, subtree: false });

            // eventos do select de linhas por página
            perPageSelect.addEventListener('change', () => renderPage(1));

            // se a tabela já tiver linhas no carregamento, inicializa agora
            document.addEventListener('DOMContentLoaded', () => {
                initPagination(true);
            });

            // expor função global caso seja necessário forçar atualização após alterações
            window.refreshAttemptsPagination = () => initPagination(true);
        })();