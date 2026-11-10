/* Privacy-first visit counter: no cookies, no IP or user-agent stored, honours Do Not Track.
   Sends page views and a few actions (app opened, link clicked) to my own collector. */
(() => {
  if (/^(localhost|127\.)/.test(location.hostname)) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  const EP = 'https://rakshak-stats.pages.dev/api/hit';
  const SITE = window.TRACK_SITE || 'portfolio';
  const q = new URLSearchParams(location.search);
  let tag = (q.get('ref') || '').replace(/[^\w.-]/g, '').slice(0, 40);
  try { if (tag) sessionStorage.setItem('ref_tag', tag); else tag = sessionStorage.getItem('ref_tag') || ''; } catch (e) { /* ignore */ }
  let ref = '';
  try { ref = new URL(document.referrer).hostname.replace(/^www\./, ''); if (ref === location.hostname) ref = ''; } catch (e) { /* none */ }
  const dev = innerWidth < 760 ? 'mobile' : innerWidth < 1100 ? 'tablet' : 'desktop';
  const send = (ev, extra) => {
    try { navigator.sendBeacon(EP, new Blob([JSON.stringify({ ev, site: SITE, path: location.pathname, extra, ref, tag, dev })], { type: 'text/plain' })); } catch (e) { /* ignore */ }
  };
  window.track = send;
  send('view');
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const h = a.getAttribute('href') || '';
    if (h.startsWith('mailto:')) send('click', /sum/i.test(decodeURIComponent(h)) ? 'resume-request' : 'email');
    else if (/github\.com\/raksh3011\/(MSA|FloatChat)/.test(h)) send('click', 'source:' + h.split('/').pop());
    else if (/linkedin\.com/.test(h)) send('click', 'linkedin');
    else if (/github\.com\/raksh3011\/?$/.test(h)) send('click', 'github');
  }, true);
})();
