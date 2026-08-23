// MHDS — render de estrategias (pasivas/activas), búsqueda y fichas
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

  // ---------- Búsqueda ----------
  let searchTimer;
  searchEl.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = searchEl.value.trim().toLowerCase();
      render();
      if (state.query) $('#strategy-root').scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // ---------- Tarjetas ----------
  function cardHTML(s) {
    const cat = CATEGORIES[s.cat];
    let excerpt = s.text || '';
    if (s.capas) excerpt = s.capas.join(' · ');
    if (!excerpt && s.ventajas) excerpt = 'Ventajas y desventajas de esta configuración.';
    if (excerpt.length > 130) excerpt = excerpt.slice(0, 130).replace(/\s\S*$/, '') + '…';

    const badges = [];
    if (s.iram) {
      const cls = s.iram === 'No cumple' ? 'iram-no' : s.iram === 'Tipo A' ? 'iram-a' : s.iram === 'Tipo B' ? 'iram-b' : 'iram-c';
      badges.push(`<span class="iram-badge ${cls}">${esc(s.iram)}</span>`);
    }
    if (s.esp) badges.push(`<span class="data-badge">${esc(s.esp)}</span><span class="data-badge">K ${esc(s.k)}</span>`);
    if (s.kdato) badges.push(`<span class="data-badge">${esc(s.kdato)}</span>`);

    return `<button class="card" style="--c:${cat.color}" data-code="${s.code}">
      <div class="card-img"><img src="${imgFor(s)}" alt="${esc(s.code)} — ${esc(s.title)}" loading="lazy"></div>
      <div class="card-body">
        <span class="code">${hl(s.code)}</span>
        <h4>${hl(s.title)}</h4>
        ${badges.length ? `<div class="badges">${badges.join('')}</div>` : ''}
        <span class="excerpt">${hl(excerpt)}</span>
      </div>
    </button>`;
  }

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
    if (key === 'EN') {
      const en13 = STRATEGIES.find(s => s.code === 'EN13');
      return tipbox(esc(en13.tip));
    }
    if (key === 'EV') {
      return tipbox('Una pared de <b>Steel Framing aisla 9 veces más</b> que una de ladrillo común de similar espesor.') +
        tipbox('La relación área ventana/muro óptima es de <b>40% de superficie vidriada hacia la orientación norte</b>, mientras que para el resto de las orientaciones es recomendable <b>no superar el 10%</b>.') +
        tipbox('La utilización de DVH y persianas exteriores de PVC pueden <b>mejorar un 600%</b> el rendimiento de una ventana con vidriado simple.');
    }
    if (key === 'P') {
      const v = VEGETACION_EXTRA;
      return `<div class="cat-intro">
        <p>${esc(v.intro)}</p>
        <ul class="veg-list">${v.items.map(([b, t]) => `<li><b>${esc(b)}</b> ${esc(t)}</li>`).join('')}</ul>
        <p>${esc(v.cierre)}</p>
      </div>` + tipbox(v.tip);
    }
    if (key === 'ER') {
      const er03 = STRATEGIES.find(s => s.code === 'ER03');
      return er03.tips.map(tipbox).join('');
    }
    if (key === 'RH') {
      const rh03 = STRATEGIES.find(s => s.code === 'RH03');
      return tipbox(rh03.tip);
    }
    return '';
  }

  const tipbox = html => `<div class="tipbox"><span class="tip-icon">💡</span><p>${html}</p></div>`;

  // ---------- Render ----------
  function render() {
    const frag = [];
    let total = 0;

    TYPES.forEach(t => {
      const cats = Object.entries(CATEGORIES).filter(([, c]) => c.type === t.key);
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

        catBlocks.push(`<div class="cat-section" id="cat-${key}" style="--c:${cat.color}">
          <div class="cat-header">
            <div class="cat-icon"><img src="${iconFor(cat)}" alt="" loading="lazy"></div>
            <div class="cat-header-text">
              <span class="cat-num">${cat.num} | ${cat.name} <span class="cat-tag">${cat.tag}</span></span>
            </div>
          </div>
          ${catIntroHTML(key)}
          ${groups.map(g => `
            ${g.name ? `<p class="group-title">${esc(g.name)}</p>` : ''}
            <div class="cards">${g.items.map(cardHTML).join('')}</div>
          `).join('')}
          ${catOutroHTML(key)}
        </div>`);
      });

      if (!catBlocks.length) return;

      frag.push(`<section class="type-section" id="${t.id}">
        <div class="type-banner">
          <p class="type-banner-pre">ESTRATEGIAS</p>
          <h2>${t.title}</h2>
        </div>
        <div class="section type-body">
          ${state.query ? '' : `<div class="cat-nav">${cats.map(([key, c]) =>
            `<a class="chip chip-cat" style="--c:${c.color}" href="#cat-${key}"><span class="dot"></span>${c.num} | ${c.name}</a>`).join('')}</div>`}
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

    $$('.card', rootEl).forEach(el => el.addEventListener('click', () => openModal(el.dataset.code)));
  }

  // ---------- Modal ----------
  const modal = $('#modal');
  const modalContent = $('#modal-content');

  function openModal(code) {
    const s = STRATEGIES.find(x => x.code === code);
    if (!s) return;
    const cat = CATEGORIES[s.cat];
    const parts = [];

    parts.push(`<div class="modal-head">
      <div>
        <span class="code-lg">${esc(s.code)}</span>
        <h3 id="modal-title">${esc(s.title)}</h3>
        <p class="modal-meta">${cat.num} | ${cat.name} ${cat.tag}${s.group ? ' · ' + esc(s.group) : ''} · Estrategia ${cat.type}</p>
      </div>
    </div>`);

    parts.push(`<div class="modal-fig"><img src="${imgFor(s)}" alt="${esc(s.code)} — ${esc(s.title)}"></div>`);

    if (s.text) parts.push(`<p class="modal-text">${esc(s.text)}</p>`);

    if (s.esp || s.kdato) {
      parts.push('<div class="datos">');
      if (s.esp) parts.push(`<div class="dato"><div class="lbl">Esp. total</div><div class="val">${esc(s.esp)}</div></div>
        <div class="dato"><div class="lbl">K (W/m²K)</div><div class="val">${esc(s.k)}</div></div>
        <div class="dato"><div class="lbl">IRAM 11603</div><div class="val" style="font-size:1.05rem">${esc(s.iram)}</div></div>`);
      if (s.kdato) parts.push(`<div class="dato"><div class="lbl">Transmitancia</div><div class="val" style="font-size:1.1rem">${esc(s.kdato)}</div></div>`);
      parts.push('</div>');
    }

    if (s.capas) {
      parts.push(`<h5>Solución — capas que la componen</h5><ul class="plain">${s.capas.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`);
    }

    if (s.ventajas || s.desventajas) {
      parts.push('<div class="vd-grid">');
      if (s.ventajas) parts.push(`<div class="vd-col vd-ventajas"><h5>Ventajas</h5><ul>${s.ventajas.map(v => `<li>${esc(v)}</li>`).join('')}</ul></div>`);
      if (s.desventajas) parts.push(`<div class="vd-col vd-desventajas"><h5>Desventajas</h5><ul>${s.desventajas.map(v => `<li>${esc(v)}</li>`).join('')}</ul></div>`);
      parts.push('</div>');
    }

    if (s.ciclo) {
      parts.push(`<div class="ciclo"><p class="ciclo-intro">${esc(s.ciclo.intro)}</p><ol>${s.ciclo.pasos.map(([b, t]) => `<li><b>${esc(b)}</b> ${esc(t)}</li>`).join('')}</ol></div>`);
    }

    if (s.tabla) {
      const t = s.tabla;
      const row = r => `<tr><td></td>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`;
      parts.push(`<div class="table-wrap"><table class="ae-table">
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

    if (s.tip) parts.push(tipbox(s.tip));
    if (s.tips) s.tips.forEach(t => parts.push(tipbox(t)));

    modalContent.innerHTML = parts.join('');
    modalContent.parentElement.style.setProperty('--mc', cat.color);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  $('#modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  render();
})();
