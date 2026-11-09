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
