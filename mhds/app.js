// MHDS — lógica de navegación, filtros, búsqueda y fichas
(function () {
  'use strict';

  const state = { type: 'todas', cat: null, query: '' };

  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

  const catFiltersEl = $('#catFilters');
  const sectionsEl = $('#strategy-sections');
  const countEl = $('#results-count');
  const searchEl = $('#searchbox');

  // ---------- Filtros por categoría ----------
  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const btn = document.createElement('button');
    btn.className = 'chip chip-cat';
    btn.dataset.cat = key;
    btn.style.setProperty('--c', cat.color);
    btn.innerHTML = `<span class="dot"></span>${cat.num} | ${cat.name} ${cat.tag}`;
    btn.addEventListener('click', () => {
      state.cat = state.cat === key ? null : key;
      $$('.chip-cat').forEach(b => b.classList.toggle('active', b.dataset.cat === state.cat));
      render();
    });
    catFiltersEl.appendChild(btn);
  });

  $$('.chip-type').forEach(btn => {
    btn.addEventListener('click', () => {
      state.type = btn.dataset.type;
      $$('.chip-type').forEach(b => b.classList.toggle('active', b === btn));
      render();
    });
  });

  let searchTimer;
  searchEl.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = searchEl.value.trim().toLowerCase();
      render();
      if (state.query) $('#estrategias').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 180);
  });

  // ---------- Búsqueda ----------
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

  function visible(s) {
    const cat = CATEGORIES[s.cat];
    if (state.type !== 'todas' && cat.type !== state.type) return false;
    if (state.cat && s.cat !== state.cat) return false;
    return matches(s);
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

  // ---------- Render de tarjetas ----------
  function cardHTML(s) {
    const cat = CATEGORIES[s.cat];
    let excerpt = s.text || (s.ventajas ? 'Ventajas y desventajas de esta configuración tipológica.' : '');
    if (s.capas) excerpt = s.capas.join(' · ');
    if (excerpt.length > 150) excerpt = excerpt.slice(0, 150).replace(/\s\S*$/, '') + '…';

    const badges = [];
    if (s.iram) {
      const cls = s.iram === 'No cumple' ? 'iram-no' : s.iram === 'Tipo A' ? 'iram-a' : s.iram === 'Tipo B' ? 'iram-b' : 'iram-c';
      badges.push(`<span class="iram-badge ${cls}">${esc(s.iram)}</span>`);
    }
    const kline = s.esp ? `<div class="k-badge">${esc(s.esp)} · K ${esc(s.k)} W/m²K</div>` : (s.kdato ? `<div class="k-badge">${esc(s.kdato)}</div>` : '');

    return `<button class="card" style="--c:${cat.color}" data-code="${s.code}">
      <span class="code">${hl(s.code)}</span>
      <h4>${hl(s.title)}</h4>
      ${kline}
      ${badges.length ? `<div class="badges">${badges.join('')}</div>` : ''}
      <span class="excerpt">${hl(excerpt)}</span>
      <span class="more">Ver ficha completa →</span>
    </button>`;
  }

  function catIntroHTML(key) {
    if (state.query) return '';
    if (key === 'EV') {
      const c = ENVOLVENTES_COLOR;
      return `<div class="cat-intro">
        <p><b>Consideraciones generales.</b> ${c.p1}</p>
        <div class="vd-grid">
          <div class="vd-col" style="background:#3d4540;color:#fff"><h5 style="color:#fff">${c.oscuros.label} <small>${c.oscuros.sub}</small></h5><ul>${c.oscuros.items.map(i => `<li>${i}</li>`).join('')}</ul></div>
          <div class="vd-col" style="background:#f2f1ec;border:1px solid var(--line)"><h5>${c.claros.label} <small>${c.claros.sub}</small></h5><ul>${c.claros.items.map(i => `<li>${i}</li>`).join('')}</ul></div>
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
        <ul class="plain" style="padding-left:20px">${v.items.map(([b, t]) => `<li><b style="color:${CATEGORIES.P.color}">${esc(b)}</b> ${esc(t)}</li>`).join('')}</ul>
        <p style="margin-top:10px">${esc(v.cierre)}</p>
        <div class="tipbox"><span class="tip-icon">💡</span><p>${v.tip}</p></div>
      </div>`;
    }
    if (key === 'ER') {
      const er03 = STRATEGIES.find(s => s.code === 'ER03');
      return er03.tips.map(t => `<div class="tipbox"><span class="tip-icon">💡</span><p>${t}</p></div>`).join('');
    }
    if (key === 'RH') {
      const rh03 = STRATEGIES.find(s => s.code === 'RH03');
      return `<div class="tipbox"><span class="tip-icon">💡</span><p>${rh03.tip}</p></div>
        <p class="footnote"><sup>12</sup> ${esc(FOOTNOTES[12])}<br><sup>13</sup> ${esc(FOOTNOTES[13])}</p>`;
    }
    if (key === 'EN') {
      const en13 = STRATEGIES.find(s => s.code === 'EN13');
      return `<div class="tipbox"><span class="tip-icon">💡</span><p>${esc(en13.tip)}</p></div>`;
    }
    if (key === 'EV') {
      return `<div class="tipbox"><span class="tip-icon">💡</span><p>Una pared de <b>Steel Framing aisla 9 veces más</b> que una de ladrillo común de similar espesor.<sup>8</sup></p></div>
        <div class="tipbox"><span class="tip-icon">💡</span><p>La relación área ventana/muro óptima es de <b>40% de superficie vidriada hacia la orientación norte</b><sup>9</sup>, mientras que para el resto de las orientaciones es recomendable <b>no superar el 10%</b>.</p></div>
        <div class="tipbox"><span class="tip-icon">💡</span><p>La utilización de DVH y persianas exteriores de PVC pueden <b>mejorar un 600%</b><sup>10</sup> el rendimiento de una ventana con vidriado simple.</p></div>
        <p class="footnote"><sup>7</sup> ${esc(FOOTNOTES[7])}<br><sup>8</sup> ${esc(FOOTNOTES[8])}<br><sup>9</sup> ${esc(FOOTNOTES[9])}<br><sup>10</sup> ${esc(FOOTNOTES[10])}</p>`;
    }
    return '';
  }

  function render() {
    const frag = [];
    let total = 0;

    Object.entries(CATEGORIES).forEach(([key, cat]) => {
      const items = STRATEGIES.filter(s => s.cat === key && visible(s));
      if (!items.length) return;
      total += items.length;

      // agrupar por subgrupo conservando el orden
      const groups = [];
      items.forEach(s => {
        const g = s.group || '';
        let bucket = groups.find(b => b.name === g);
        if (!bucket) { bucket = { name: g, items: [] }; groups.push(bucket); }
        bucket.items.push(s);
      });

      frag.push(`<div class="cat-section" style="--c:${cat.color}">
        <div class="cat-header" style="--c:${cat.color}">
          <span class="cat-num">${cat.num}</span>
          <h3>${cat.name} <small>${cat.tag}</small></h3>
          <span class="cat-type">Estrategias ${cat.type === 'pasiva' ? 'pasivas' : 'activas'}</span>
        </div>
        ${catIntroHTML(key)}
        ${groups.map(g => `
          ${g.name ? `<p class="group-title">${esc(g.name)}</p>` : '<div style="height:12px"></div>'}
          <div class="cards">${g.items.map(cardHTML).join('')}</div>
        `).join('')}
        ${catOutroHTML(key)}
      </div>`);
    });

    sectionsEl.innerHTML = frag.join('') || '<p style="color:var(--ink-soft);padding:30px 4px">No se encontraron estrategias con ese criterio.</p>';
    countEl.textContent = `${total} estrategia${total === 1 ? '' : 's'}${state.query ? ` para “${searchEl.value.trim()}”` : ''}`;

    $$('.card', sectionsEl).forEach(el => el.addEventListener('click', () => openModal(el.dataset.code)));
  }

  // ---------- Modal ----------
  const modal = $('#modal');
  const modalContent = $('#modal-content');

  function openModal(code) {
    const s = STRATEGIES.find(x => x.code === code);
    if (!s) return;
    const cat = CATEGORIES[s.cat];
    const parts = [];

    parts.push(`<span class="code-lg">${esc(s.code)}</span>`);
    parts.push(`<h3>${esc(s.title)}</h3>`);
    parts.push(`<p class="modal-meta">${cat.num} | ${cat.name} ${cat.tag}${s.group ? ' · ' + esc(s.group) : ''} · Estrategia ${cat.type}</p>`);

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

    if (s.tip) parts.push(`<div class="tipbox"><span class="tip-icon">💡</span><p>${s.tip}</p></div>`);
    if (s.tips) s.tips.forEach(t => parts.push(`<div class="tipbox"><span class="tip-icon">💡</span><p>${t}</p></div>`));

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

  // ---------- Bibliografía y notas ----------
  $('#biblio-list').innerHTML = BIBLIOGRAFIA.map(b => `<li>${b}</li>`).join('');
  $('#footnotes-list').innerHTML = Object.entries(FOOTNOTES).map(([n, t]) => `<li value="${n}">${esc(t)}</li>`).join('');

  render();
})();
