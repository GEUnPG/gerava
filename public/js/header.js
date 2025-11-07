(function () {
  if (globalThis.window.__headerLoaded) return;
  globalThis.window.__headerLoaded = true;

  function mount() {
    const target = document.getElementById('app-header');
    if (!target) return;
    // Pega título da página do dataset ou do título atual
    const providedTitle =
      target.dataset.title ||
      globalThis.window.PAGE_TITLE ||
      document.title ||
      'GerAva';
    // Markup do header
    const html = `
<header class="header">
  <a href="/dashboard.html" class="btn btn-outline-light btn-back">
    <i class="fas fa-arrow-left"></i> Voltar
  </a>
  <h1 class="titulo" id="page-title"></h1>
  <div class="user-info">
    <span id="user-greeting" class="bem-vindo">Bem-vindo, Carregando...</span>
    <button class="btn-logout btn btn-outline-light" onclick="logout()">
      <i class="fas fa-sign-out-alt"></i> Sair
    </button>
    <label class="form-check form-switch theme-switch m-0 d-flex align-items-center">
      <input class="form-check-input" type="checkbox" role="switch" id="themeSwitch" aria-label="Alternar tema escuro" aria-checked="false">
      <span class="titulo ms-2">Tema</span>
    </label>
  </div>
</header>
    `;
    target.innerHTML = html;
    // Seta H1 e document.title
    const h1 = target.querySelector('#page-title');
    if (h1) h1.textContent = providedTitle;
    if (document.title !== providedTitle) {
      document.title = providedTitle;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();

