(function(){
  function broadcastRoute(){
    if (!window.PIbus) return; // protecție la first paint
    window.PIbus.emit('nav-changed', { path: location.pathname, hash: location.hash });
  }
  // la load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', broadcastRoute);
  } else {
    broadcastRoute();
  }
  // hash routing
  window.addEventListener('hashchange', broadcastRoute);
  // History API (SPA)
  ['pushState','replaceState'].forEach(fn=>{
    const orig = history[fn];
    history[fn] = function(){
      const ret = orig.apply(this, arguments);
      setTimeout(broadcastRoute, 0);
      return ret;
    };
  });
  // răspunde la cererea de rută
  if (typeof BroadcastChannel !== 'undefined') {
    const ch = new BroadcastChannel('pi-ui');
    ch.onmessage = (e) => {
      if (e.data && e.data.type === 'nav-request') broadcastRoute();
    };
  }
})();
