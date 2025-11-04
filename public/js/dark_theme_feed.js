function toggleFeedback() {
      document.getElementById("feedback-card").classList.toggle("show");
    } /* [web:32] */

    (function initTheme() {
      const storageKey = 'foamed-theme';
      const mq = globalThis.window.matchMedia && globalThis.window.matchMedia('(prefers-color-scheme: dark)');
      const prefersDark = mq && mq.matches;
      const saved = localStorage.getItem(storageKey);
      const initialTheme = saved || (prefersDark ? 'dark' : 'light');

      document.documentElement.classList.add(initialTheme === 'dark' ? 'theme-dark' : 'theme-light');

      function applyTheme(next) {
        document.documentElement.classList.remove('theme-dark', 'theme-light');
        document.documentElement.classList.add(next === 'dark' ? 'theme-dark' : 'theme-light');
        localStorage.setItem(storageKey, next);
        const sw = document.getElementById('themeSwitch');
        if (sw) sw.checked = (next === 'dark');
      } /* [web:12][web:14] */

      globalThis.window.toggleTheme = function() {
        const current = document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
      }; /* [web:11] */

      globalThis.window.addEventListener('DOMContentLoaded', () => {
        const sw = document.getElementById('themeSwitch');
        if (sw) {
          sw.checked = document.documentElement.classList.contains('theme-dark');
          sw.addEventListener('change', () => applyTheme(sw.checked ? 'dark' : 'light'));
        }
      }); /* [web:32][web:11] */

      if (!saved && mq && mq.addEventListener) {
        mq.addEventListener('change', e => applyTheme(e.matches ? 'dark' : 'light'));
      } /* [web:11] */
    })();