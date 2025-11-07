// Carrega o footer dinamicamente dentro de #app-footer
(function () {
  // Evita rodar duas vezes
  if (globalThis.window.__footerLoaded) return;
  globalThis.window.__footerLoaded = true;

  function toggleFeedback() {
    const card = document.getElementById('feedback-card');
    if (!card) return;
    card.classList.toggle('show');
  }
  // expõe a função se você usa onclick no HTML
  globalThis.window.toggleFeedback = toggleFeedback;

  const mount = () => {
    const target = document.getElementById('app-footer');
    if (!target) return;

    const html = `
<footer class="footer bg-dark text-light pt-4 mt-5">
  <div class="container">
    <div class="row">
      <div class="col-md-4 mb-3">
        <h5 class="fw-bold">GerAva</h5>
        <p class="small text-muted">Sistema de gestão de avaliações e chatbot integrado ao WhatsApp, feito para facilitar a comunicação e organização acadêmica.</p>
      </div>
      <div class="col-md-4 mb-3">
        <h5 class="fw-bold">Links</h5>
        <ul class="list-unstyled">
          <li><a href="/login.html" class="text-decoration-none text-light"><i class="fas fa-sign-in-alt me-2"></i>Acessar Sistema</a></li>
          <li><a href="/consulta.html" class="text-decoration-none text-light"><i class="fas fa-search me-2"></i>Consultar Provas</a></li>
          <li><a href="https://forms.gle/seu-formulario" target="_blank" class="text-decoration-none text-light"><i class="fas fa-comment-dots me-2"></i>Feedback</a></li>
        </ul>
      </div>
      <div class="col-md-4 mb-3">
        <h5 class="fw-bold">Contato</h5>
        <p class="small mb-1"><i class="fas fa-envelope me-2"></i>suporte@geunpg.com</p>
        <p class="small mb-1"><i class="fas fa-phone me-2"></i>(11) 99999-9999</p>
        <div>
          <a href="https://wa.me/24999999850" target="_blank" class="text-light me-3"><i class="fab fa-whatsapp fa-lg"></i></a>
          <a href="https://www.facebook.com/geunpg/" target="_blank" class="text-light me-3"><i class="fab fa-facebook fa-lg"></i></a>
          <a href="https://br.linkedin.com/school/geunpg/" target="_blank" class="text-light me-3"><i class="fab fa-linkedin fa-lg"></i></a>
          <a href="https://www.instagram.com/geunpg/" target="_blank" class="text-light me-3"><i class="fab fa-instagram fa-lg"></i></a>
          <a href="https://www.youtube.com/@geunpg" target="_blank" class="text-light"><i class="fab fa-youtube fa-lg"></i></a>
        </div>
      </div>
    </div>
    <hr class="border-light">
    <div class="text-center small">© 2025 GEUnPG. Todos os direitos reservados.</div>
  </div>
</footer>

<button class="feedback-btn" aria-label="Abrir feedback">
  <i class="fas fa-bullhorn"></i>
</button>

<div id="feedback-card" class="feedback-card" aria-live="polite">
  <div class="d-flex align-items-start">
    <div class="me-2"><i class="fas fa-bullhorn text-success fa-lg"></i></div>
    <div>
      <h6 class="fw-bold mb-1">Ajude-nos a melhorar!</h6>
      <p class="mb-2 small text-muted">Responda o formulário e compartilhe com a gente sua opinião.</p>
      <a href="https://forms.gle/seu-formulario" target="_blank" class="btn btn-success btn-sm">Responder</a>
    </div>
  </div>
  <button class="btn-close position-absolute top-0 end-0 m-2" aria-label="Fechar"></button>
</div>
    `;

    // injeta o markup
    target.insertAdjacentHTML('afterbegin', html);

    // comportamentos
    const btn = document.querySelector('.feedback-btn');
    const closeBtn = document.querySelector('#feedback-card .btn-close');
    btn?.addEventListener('click', toggleFeedback);
    closeBtn?.addEventListener('click', toggleFeedback);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();

