document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'})}}));


// Clean public routes use folders (/SOC/ and /pentesting/).
// Direct file:// browsing does not automatically resolve a folder to index.html
// in every browser, so rewrite only during local preview.
if (window.location.protocol === 'file:') {
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^[a-z]+:/i.test(href)) return;

    // e.g. SOC/#case2 -> SOC/index.html#case2
    const hashPos = href.indexOf('/#');
    if (hashPos !== -1) {
      a.setAttribute('href', href.slice(0, hashPos + 1) + 'index.html' + href.slice(hashPos + 1));
      return;
    }

    // e.g. pentesting/ -> pentesting/index.html
    if (href.endsWith('/')) {
      a.setAttribute('href', href + 'index.html');
    }
  });
}
