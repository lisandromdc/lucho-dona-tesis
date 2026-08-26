// MHDS — render de estrategias (pasivas/activas), navegación desplegable y búsqueda
(function () {
  'use strict';

  const state = { query: '' };

  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

  const rootEl = $('#strategy-root');
  const noteEl = $('#results-note');
  const searchEl = $('#searchbox');

  const TYPES = [
    { key: 'pasiva', id: 'pasivas', title: 'PASIVAS' },
    { key: 'activa', id: 'activas', title: 'ACTIVAS' },
  ];

  const imgFor = s => `assets/strategies/${s.code}.jpg`;
  const iconFor = cat => `assets/icons/cat-${Number(cat.num)}.png`;
  const catsOf = type => Object.entries(CATEGORIES).filter(([, c]) => c.type === type);

  // ---------- Búsqueda ----------
  let searchTimer;
  searchEl.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = searchEl.value.trim().toLowerCase();
      render();
      if (state.query) rootEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 180);
  });

  function matches(s) {
    if (!state.query) return true;
    const hay = [
      s.code, s.title, s.text || '', s.group || '',
      CATEGORIES[s.cat].name,
      (s.ventajas || []).join(' '), (s.desventajas || []).join(' '),
      (s.capas || []).join(' '), s.kdato || '', s.tip || '', (s.tips || []).join(' '),
    ].join(' ').toLowerCase();
    return state.query.split(/\s+/).every(w => hay.includes(w));
  }

  function esc(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function hl(str) {
    const escaped = esc(str);
    if (!state.query) return escaped;
    let out = escaped;
    state.query.split(/\s+/).filter(Boolean).forEach(w => {
      const safe = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(`(${safe})`, 'gi'), '<mark>$1</mark>');
    });
    return out;
  }

  const tipbox = html => `<div class="tipbox"><span class="tip-icon">💡</span><p>${html}</p></div>`;

  // ---------- Menú desplegable del nav ----------
  function buildNavMenus() {
    $$('.nav-menu').forEach(menu => {
      const type = menu.dataset.type;
      menu.innerHTML = catsOf(type).map(([key, c]) => `
        <div class="nav-cat" style="--c:${c.color}">
          <a href="#cat-${key}"><span class="dot"></span><span class="nav-cat-name">${c.num} ${c.name}</span><span class="nav-caret">›</span></a>
          <div class="nav-sub">
            ${STRATEGIES.filter(s => s.cat === key).map(s =>
              `<a href="#s-${s.code}"><b>${s.code}</b> ${esc(s.title)}</a>`).join('')}
          </div>
        </div>`).join('');
    });
  }

  // ---------- Sponsors ----------
  function initSponsors() {
    const logo = s => {
      const img = `<img src="${s.img}" alt="${esc(s.name)}" loading="lazy">`;
      return s.url ? `<a href="${s.url}" target="_blank" rel="noopener" title="${esc(s.name)}">${img}</a>` : img;
    };
    $$('.sponsor-bar-logos, .sponsor-logos').forEach(el => {
      el.innerHTML = SPONSORS.map(logo).join('');
    });

    const overlay = $('#sponsor-overlay');
    if (!overlay || !SPONSORS.length) return;
    const close = () => {
      overlay.classList.add('closing');
      setTimeout(() => { overlay.hidden = true; document.body.style.overflow = ''; }, 180);
    };
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#sponsor-close').addEventListener('click', close);
    $('#sponsor-continue').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) close(); });
  }

  // ---------- Ficha de estrategia (formato del anexo: código · título | imagen | descripción) ----------
  function strategyHTML(s) {
    const cat = CATEGORIES[s.cat];

    const badges = [];
    if (s.iram) {
      const cls = s.iram === 'No cumple' ? 'iram-no' : s.iram === 'Tipo A' ? 'iram-a' : s.iram === 'Tipo B' ? 'iram-b' : 'iram-c';
      badges.push(`<span class="iram-badge ${cls}">${esc(s.iram)}</span>`);
    }
    if (s.esp) badges.push(`<span class="data-badge">Esp. ${esc(s.esp)}</span><span class="data-badge">K ${esc(s.k)} W/m²K</span>`);
    if (s.kdato) badges.push(`<span class="data-badge">${esc(s.kdato)}</span>`);

    const extras = [];
    if (s.capas) {
      extras.push(`<p class="st-label">Solución — capas que la componen:</p>
        <ul class="st-capas">${s.capas.map(c => `<li>${hl(c)}</li>`).join('')}</ul>`);
    }
    if (s.ventajas || s.desventajas) {
      extras.push(`<div class="vd-grid">
        ${s.ventajas ? `<div class="vd-col vd-ventajas"><h5>Ventajas</h5><ul>${s.ventajas.map(v => `<li>${hl(v)}</li>`).join('')}</ul></div>` : ''}
        ${s.desventajas ? `<div class="vd-col vd-desventajas"><h5>Desventajas</h5><ul>${s.desventajas.map(v => `<li>${hl(v)}</li>`).join('')}</ul></div>` : ''}
      </div>`);
    }
    if (s.ciclo) {
      extras.push(`<div class="ciclo"><p class="ciclo-intro">${esc(s.ciclo.intro)}</p><ol>${s.ciclo.pasos.map(([b, t]) => `<li><b>${esc(b)}</b> ${esc(t)}</li>`).join('')}</ol></div>`);
    }
    if (s.tabla) {
      const t = s.tabla;
      const row = r => `<tr><td></td>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`;
      extras.push(`<div class="table-wrap"><table class="ae-table">
        <thead><tr>${t.headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>
          <tr class="grp"><td colspan="5">TRADICIONALES</td></tr>
          ${t.tradicionales.map(row).join('')}
          <tr class="tt-row"><td>TOTAL</td><td></td><td></td><td></td><td>${t.totalTradicionales}</td></tr>
          <tr class="grp"><td colspan="5">EFICIENTES</td></tr>
          ${t.eficientes.map(row).join('')}
          <tr class="tt-row"><td>TOTAL</td><td></td><td></td><td></td><td>${t.totalEficientes}</td></tr>
        </tbody>
      </table></div>
      <p class="caption">${esc(t.caption).replace(/\n/g, '<br>')}</p>`);
    }
    if (s.tip) extras.push(tipbox(s.tip));
    if (s.tips) s.tips.forEach(t => extras.push(tipbox(t)));

    return `<article class="st-item" id="s-${s.code}" style="--c:${cat.color}">
      <header class="st-head"><span class="st-code">${hl(s.code)}</span><h4 class="st-title">${hl(s.title)}</h4></header>
      <div class="st-media"><img src="${imgFor(s)}" alt="${esc(s.code)} — ${esc(s.title)}" loading="lazy"></div>
      <div class="st-body">
        ${badges.length ? `<div class="badges">${badges.join('')}</div>` : ''}
        ${s.text ? `<p class="st-text">${hl(s.text)}</p>` : ''}
        ${extras.join('')}
      </div>
    </article>`;
  }

  // ---------- Intros / cierres de categoría ----------
  function catIntroHTML(key) {
    if (state.query) return '';
    if (key === 'EV') {
      const c = ENVOLVENTES_COLOR;
      return `<div class="cat-intro">
        <p class="group-title-inline">Consideraciones generales</p>
        <p>${c.p1}</p>
        <div class="vd-grid">
          <div class="vd-col color-oscuros"><h5>${c.oscuros.label} <small>${c.oscuros.sub}</small></h5><ul>${c.oscuros.items.map(i => `<li>${i}</li>`).join('')}</ul></div>
          <div class="vd-col color-claros"><h5>${c.claros.label} <small>${c.claros.sub}</small></h5><ul>${c.claros.items.map(i => `<li>${i}</li>`).join('')}</ul></div>
        </div>
        <p>${c.p2}</p><p>${c.p3}</p>
      </div>`;
    }
    if (key === 'RH') {
      return `<div class="cat-intro">${RH_INTRO.split('\n\n').map(p => `<p>${esc(p)}</p>`).join('')}</div>`;
    }
    return '';
  }

  function catOutroHTML(key) {
    if (state.query) return '';
    if (key === 'P') {
      const v = VEGETACION_EXTRA;
      return `<div class="cat-intro">
        <p>${esc(v.intro)}</p>
        <ul class="veg-list">${v.items.map(([b, t]) => `<li><b>${esc(b)}</b> ${esc(t)}</li>`).join('')}</ul>
        <p>${esc(v.cierre)}</p>
      </div>` + tipbox(v.tip);
    }
    return '';
  }

  // ---------- Render ----------
  function render() {
    const frag = [];
    let total = 0;

    TYPES.forEach(t => {
      const cats = catsOf(t.key);
      const catBlocks = [];

      cats.forEach(([key, cat]) => {
        const items = STRATEGIES.filter(s => s.cat === key && matches(s));
        if (!items.length) return;
        total += items.length;

        const groups = [];
        items.forEach(s => {
          const g = s.group || '';
          let bucket = groups.find(b => b.name === g);
          if (!bucket) { bucket = { name: g, items: [] }; groups.push(bucket); }
          bucket.items.push(s);
        });

        catBlocks.push(`<details class="cat-section" id="cat-${key}" style="--c:${cat.color}"${state.query ? ' open' : ''}>
          <summary class="cat-header">
            <div class="cat-icon"><img src="${iconFor(cat)}" alt="" loading="lazy"></div>
            <div class="cat-header-text">
              <span class="cat-num">${cat.num} | ${cat.name} <span class="cat-tag">${cat.tag}</span></span>
              <svg class="cat-arrow" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </summary>
          <div class="cat-content">
            ${catIntroHTML(key)}
            ${groups.map(g => `
              ${g.name ? `<p class="group-title">${esc(g.name)}</p>` : ''}
              <div class="st-grid">${g.items.map(strategyHTML).join('')}</div>
            `).join('')}
            ${catOutroHTML(key)}
          </div>
        </details>`);
      });

      if (!catBlocks.length) return;

      frag.push(`<section class="type-section" id="${t.id}">
        <div class="type-banner">
          <div class="type-banner-inner">
            <p class="type-banner-pre">ESTRATEGIAS</p>
            <h2>${t.title}</h2>
            ${state.query ? '' : `<div class="cat-nav">${cats.map(([key, c]) =>
              `<a class="chip chip-cat" style="--c:${c.color}" href="#cat-${key}"><span class="dot"></span>${c.num} | ${c.name}</a>`).join('')}</div>`}
          </div>
        </div>
        <div class="section type-body">
          ${catBlocks.join('')}
        </div>
      </section>`);
    });

    rootEl.innerHTML = frag.join('') || '';
    if (state.query) {
      noteEl.hidden = false;
      noteEl.textContent = total
        ? `${total} estrategia${total === 1 ? '' : 's'} para “${searchEl.value.trim()}”`
        : `No se encontraron estrategias para “${searchEl.value.trim()}”.`;
    } else {
      noteEl.hidden = true;
    }
  }

  // ---------- Navegación hacia categorías/estrategias colapsadas ----------
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#cat-"], a[href^="#s-"]');
    if (!a) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const det = target.matches('details') ? target : target.closest('details');
    if (det) det.open = true;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (target.classList.contains('st-item')) {
      target.classList.remove('flash');
      void target.offsetWidth;
      target.classList.add('flash');
    }
    history.replaceState(null, '', a.getAttribute('href'));
  });

  buildNavMenus();
  initSponsors();
  render();
})();
