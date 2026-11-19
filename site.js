(() => {
  const root = document.documentElement;
  const home = document.getElementById('home');
  const phone = matchMedia('(max-width: 859px)');
  let firstRun = true;

  function route() {
    const hash = decodeURIComponent(location.hash.slice(1));
    const [folderId, entrySlug] = hash.split('/');
    const found = folderId && document.getElementById(folderId);
    const folder = found && found.classList.contains('folder') ? found : null;

    // No folder chosen: the welcome screen on desktop, the team list on a phone.
    const view = !folder ? 'folders' : entrySlug ? 'entry' : 'list';
    root.dataset.view = view;
    root.dataset.open = folder ? folder.id : 'home';

    const article = folder &&
      ((entrySlug && document.getElementById(hash)) || folder.querySelector('article'));

    document.querySelectorAll('.folder, article, #home').forEach(el => el.classList.remove('open'));
    (folder || home).classList.add('open');
    if (article) article.classList.add('open');

    document.querySelectorAll('.folders a').forEach(a => {
      if (folder && a.dataset.folder === folder.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('.list li a').forEach(a => {
      if (article && a.getAttribute('href') === '#' + article.id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    window.scrollTo(0, 0);

    // On a phone each step replaces the screen, so move focus with it.
    if (!firstRun && phone.matches && view !== 'folders') {
      const target = view === 'entry' ? article.querySelector('h3') : folder.querySelector('.folder-title');
      target.focus({ preventScroll: true });
    }
    firstRun = false;
  }

  addEventListener('hashchange', route);
  route();
  // On a direct link the browser jumps to the anchor after load; undo that.
  addEventListener('load', () => requestAnimationFrame(() => window.scrollTo(0, 0)));
})();

// Buyer funnel map: the preview opens a popup that asks for an email,
// sends it to the form service, then opens the full map in a new tab.
(() => {
  const triggers = document.querySelectorAll('.map-gate');
  if (!triggers.length) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'gate';
  dialog.setAttribute('aria-labelledby', 'gate-title');
  dialog.innerHTML = `
    <form method="dialog"><button class="gate-close" aria-label="Close">&times;</button></form>
    <h2 id="gate-title">Enter your email to view the full map.</h2>
    <form class="gate-form">
      <label for="gate-email">Email</label>
      <input id="gate-email" name="email" type="email" required autocomplete="email" placeholder="you@company.com">
      <button type="submit">View the map</button>
      <p class="gate-status" role="status"></p>
    </form>`;
  document.body.append(dialog);

  const form = dialog.querySelector('.gate-form');
  const status = dialog.querySelector('.gate-status');
  const submit = form.querySelector('[type="submit"]');
  let current;

  const remembered = () => { try { return localStorage.getItem('mapGate') === 'yes'; } catch { return false; } };
  const remember = () => { try { localStorage.setItem('mapGate', 'yes'); } catch {} };

  triggers.forEach(trigger => trigger.addEventListener('click', () => {
    current = trigger;
    // Someone who already gave their email goes straight to the map.
    if (remembered() && trigger.dataset.map) {
      window.open(trigger.dataset.map, '_blank', 'noopener');
      return;
    }
    status.textContent = '';
    dialog.showModal();
  }));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const { form: endpoint, map } = current.dataset;
    if (!endpoint || !map) { status.textContent = 'The full map is not available yet.'; return; }
    // Open the tab now, while the click still counts, so pop-up blockers allow it.
    const tab = window.open('', '_blank');
    submit.disabled = true;
    status.textContent = 'Opening the map…';
    try {
      const data = new FormData(form);
      data.append('source', 'Buyer funnel map');
      data.append('_subject', 'Someone opened your buyer funnel map');
      data.append('_template', 'table');
      await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
    } catch {
      // If the form service is down, still show the map rather than block the visitor.
    }
    remember();
    if (tab) { tab.opener = null; tab.location = map; } else location.href = map;
    dialog.close();
    form.reset();
    submit.disabled = false;
  });
})();
