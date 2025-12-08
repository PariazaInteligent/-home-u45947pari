// Pariază Inteligent — SPA Loader pentru <main>
// Execută doar scripturile paginii încărcate, o singură dată, izolat (IIFE)

(function () {
  "use strict";

  var main = document.querySelector("main,#main,#main-content");
  if (!main) { console.error("SPA Loader: nu găsesc elementul <main>."); return; }

  function fetchDoc(url){
    return fetch(url, { credentials:"include" })
      .then(function(r){ if(!r.ok) throw new Error("HTTP "+r.status); return r.text(); })
      .then(function(html){ return new DOMParser().parseFromString(html, "text/html"); });
  }
  function toAbs(url, base){ try { return new URL(url, base).href; } catch(_){ return url; } }

  function runInline(code){
    var s=document.createElement("script");
    s.text="(function(){\n"+code+"\n})();";
    s.dataset.piPageScript="1";
    document.body.appendChild(s);
  }
  function runSrc(src){
    return new Promise(function(resolve,reject){
      var s=document.createElement("script");
      s.src=src; s.async=false; s.defer=false; s.dataset.piPageScript="1";
      s.onload=function(){ resolve(); }; s.onerror=function(){ reject(new Error("Load fail "+src)); };
      document.body.appendChild(s);
    });
  }
  function execScriptsSequential(scripts, baseHref){
    var chain=Promise.resolve();
    scripts.forEach(function(sc){
      chain = chain.then(function(){
        if (sc.hasAttribute("src")) return runSrc(toAbs(sc.getAttribute("src"), baseHref));
        runInline(sc.textContent||"");
      });
    });
    return chain;
  }

  function swapIntoMain(doc, url){
    var body=doc.body||doc;
    var scripts=[].slice.call(body.querySelectorAll("script"));
    scripts.forEach(function(s){ s.parentNode && s.parentNode.removeChild(s); });

    main.innerHTML = body.innerHTML;

    var baseHref = toAbs(".", url);
    return execScriptsSequential(scripts, baseHref).then(function(){
      if (typeof window.initMesaje === "function") { try{ window.initMesaje(); }catch(_){} }
    });
  }

  function loadIntoMain(url){
    main.innerHTML = '<div style="padding:16px;color:#bfefff">Se încarcă…</div>';
    return fetchDoc(url)
      .then(function(doc){ return swapIntoMain(doc, url); })
      .catch(function(err){
        console.error(err);
        main.innerHTML = '<div style="padding:16px;color:#ffb3b3">Eroare la încărcare.</div>';
      });
  }

  function route(){
    var h=(location.hash||"").replace(/^#\/?/, "").trim();
    if (!h) return;
    loadIntoMain(h);
  }

  window.PI_loadIntoMain = loadIntoMain;
  window.addEventListener("hashchange", route);
  route();
})();
