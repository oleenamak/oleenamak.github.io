(() => {
  const root = document.documentElement;

  const DEFAULT_ENTRY = 'work/american-operator';
  const phone = matchMedia('(max-width: 859px)');
  let firstRun = true;

  function route() {
    const hash = decodeURIComponent(location.hash.slice(1));
    const [folderId, entrySlug] = hash.split('/');
    const folder = folderId && document.getElementById(folderId);

    // No valid folder: phones see the folder list, desktop opens the default entry.
    const view = !folder ? 'folders' : entrySlug ? 'entry' : 'list';
    root.dataset.view = view;

    const activeFolder = folder || document.getElementById(DEFAULT_ENTRY.split('/')[0]);
    const firstArticle = activeFolder.querySelector('article');
    const article = (entrySlug && document.getElementById(hash)) ||
      (folder ? firstArticle : document.getElementById(DEFAULT_ENTRY));
    root.dataset.open = activeFolder.id;

    document.querySelectorAll('.folder, article').forEach(el => el.classList.remove('open'));
    activeFolder.classList.add('open');
    if (article) article.classList.add('open');

    document.querySelectorAll('.folders a').forEach(a => {
      if (a.dataset.folder === activeFolder.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    activeFolder.querySelectorAll('.list li a').forEach(a => {
      if (article && a.getAttribute('href') === '#' + article.id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    window.scrollTo(0, 0);

    // On a phone each step replaces the screen, so move focus with it.
    if (!firstRun && phone.matches && view !== 'folders') {
      const target = view === 'entry' ? article.querySelector('h3') : activeFolder.querySelector('.folder-title');
      target.focus({ preventScroll: true });
    }
    firstRun = false;
  }

  addEventListener('hashchange', route);
  route();
  // On a direct link the browser jumps to the anchor after load; undo that.
  addEventListener('load', () => requestAnimationFrame(() => window.scrollTo(0, 0)));
})();
