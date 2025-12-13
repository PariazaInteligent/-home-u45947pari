// ===== NAV =====
window.addEventListener('nav-changed', (e) => {
  const data = e.detail || {};
  const rawPath = (data.path || '').toLowerCase();
  const rawHash = (data.hash || '').toLowerCase();

  // extrage “cheia” rutei: ultimul segment fără extensie, sau ?page=...
  function routeKeyFrom(path, hash) {
    try {
      // cheie din hash gen "#statistici" -> "statistici"
      if (hash && /^#/.test(hash)) {
        return hash.replace(/^#\/?/, '').split(/[?#]/)[0]; // "statistici"
      }
      // cheie din query gen "/main.php?page=statistici"
      const qs = new URLSearchParams((path.split('?')[1] || ''));
      if (qs.has('page')) return (qs.get('page') || '').toLowerCase();

      // cheie din path gen "/statistici.php" -> "statistici"
      const seg = path.split('?')[0].split('/').filter(Boolean).pop() || '';
      if (!seg) return ''; // "/"
      const base = seg.replace(/\.(php|html|htm)$/, ''); // "statistici"
      return base;
    } catch {
      return '';
    }
  }

  const curKey = routeKeyFrom(rawPath, rawHash); // ex: "statistici", "dashboard", ""

  // helper pt. normalizarea href-urilor din sidebar
  function hrefKey(href) {
    if (!href) return '';
    href = href.toLowerCase();
    if (href.startsWith('#')) return href.replace(/^#\/?/, '');                 // "#statistici" -> "statistici"
    const path = href.replace(location.origin.toLowerCase(), '');               // absolut -> relativ
    const clean = path.split('?')[0].replace(/^\//, '');                        // "/statistici.php" -> "statistici.php"
    return clean.replace(/\.(php|html|htm)$/, '');                              // "statistici"
  }

  // DEBUG (temporar): vezi dacă evenimentul ajunge
  // console.log('[sidebar] nav-changed:', { rawPath, rawHash, curKey });

  const links = document.querySelectorAll('.nav-link');
  let matched = false;
  links.forEach((a) => {
    a.classList.remove('active');
    const key = hrefKey(a.getAttribute('href'));
    // reguli de potrivire:
    // - gol -> dashboard
    // - egalitate strictă pe cheie
    // - startsWith dacă vrei să permiți “statistici-extra”
    if ((curKey === '' && key === 'dashboard') ||
        (key && curKey && (curKey === key || curKey.startsWith(key)))) {
      a.classList.add('active');
      matched = true;
    }
  });

  // fallback: dacă n-am potrivit nimic și suntem pe “/”, marchează dashboard
  if (!matched) {
    const dash = document.querySelector('.nav-link[href="/dashboard.php"]');
    if (dash) dash.classList.add('active');
  }
});
