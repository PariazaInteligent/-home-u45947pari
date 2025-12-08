// Pariază Inteligent — Patch final pentru layout
// - NU atinge încărcarea header/sidebar/footer (loadInto rămâne intact)
// - Înlocuiește executeScripts cu o versiune idempotentă
// - NU re-execută niciodată scripturile din <main>
// - Elimină redeclarările (ex. 'overlay already been declared')

(function () {
  "use strict";

  // Shim pentru apeluri moștenite
  if (typeof window.restoreSidebarState !== "function") {
    window.restoreSidebarState = function () {};
  }

  // Util
  function $(sel, root){ return (root || document).querySelector(sel); }
  function $all(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function toAbs(url, base){ try { return new URL(url, base).href; } catch(_) { return url; } }

  // Versiune idempotentă a executării scripturilor
  function executeScriptsPatched(rootEl) {
    var main = $("main,#main,#main-content");
    if (!rootEl) rootEl = document;

    // Dacă ținta conține MAIN, nu procesăm aici (spa_loader.js se ocupă)
    try {
      if (main && (rootEl === main || rootEl.contains(main))) {
        // console.debug("executeScriptsPatched: skip pentru <main>");
        return;
      }
    } catch (_) {}

    // Găsește toate <script> din root
    var scripts = $all("script", rootEl);
    if (!scripts.length) return;

    var baseHref = toAbs(".", location.href);

    scripts.forEach(function (old) {
      // Dacă a mai fost executat, sari
      if (old.dataset && old.dataset.piExecuted === "1") return;

      // Marchează vechiul <script> ca executat (ca să nu-l mai luăm altă dată)
      try { old.dataset.piExecuted = "1"; } catch (_) {}

      // Construiește un <script> nou, executabil
      var s = document.createElement("script");
      // Copiază atributele utile (fără type="module"/defer care amână sau schimbă scope)
      for (var i = 0; i < old.attributes.length; i++) {
        var a = old.attributes[i];
        if (a.name === "defer") continue;
        if (a.name === "type" && old.getAttribute("type") !== "text/javascript") continue;
        if (a.name === "data-pi-executed") continue;
        s.setAttribute(a.name, a.value);
      }

      // Rulează izolat (IIFE) pentru inline; lasă src pentru externe
      if (old.src) {
        s.src = toAbs(old.getAttribute("src"), baseHref);
        s.async = false; s.defer = false;
      } else {
        s.text = "(function(){\n" + (old.textContent || "") + "\n})();";
      }

      // Marcare pentru debug / evitare reexec
      s.dataset.piExecuted = "1";

      // Ancorează în BODY (nu în rootEl) pentru execuție sigură
      (document.body || document.documentElement).appendChild(s);
    });
  }

  // Suprascrie global funcția layout-ului
  window.executeScripts = executeScriptsPatched;

  // Previne erorile dacă layout-ul avea variabile globale „const” redeclarate
  // (dacă sunt deja create din prima trecere)
  if (typeof window.overlay === "undefined") { window.overlay = null; }

  console.info("layout_patch.js — executeScripts înlocuit, <main> izolat, idempotent OK");
})();
