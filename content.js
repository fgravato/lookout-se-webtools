(() => {
  'use strict';

  // Chrome's built-in JSON viewer renders JSON into a shadow DOM on json: pages.
  // We re-fetch the same URL (session cookies are sent automatically) to get raw JSON.
  async function fetchData() {
    // 1. Try to read from the DOM first (works when Chrome shows a plain <pre>)
    const pre = document.querySelector('pre');
    if (pre) {
      try {
        const parsed = JSON.parse(pre.textContent);
        if (parsed) return parsed;
      } catch { /* fall through */ }
    }

    // 2. Try document body text (Chrome JSON viewer sometimes exposes it)
    try {
      const text = document.documentElement.innerText;
      const parsed = JSON.parse(text);
      if (parsed) return parsed;
    } catch { /* fall through */ }

    // 3. Re-fetch the same URL — session cookies are included automatically
    try {
      const res = await fetch(window.location.href, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) return await res.json();
    } catch { /* fall through */ }

    return null;
  }

  function getAllFlagNames(tenancies) {
    const names = new Set();
    for (const t of tenancies) {
      if (t.features) Object.keys(t.features).forEach(k => names.add(k));
    }
    return Array.from(names).sort();
  }

  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildTenantCard(t) {
    const card = document.createElement('div');
    card.className = 'lff-tenant-card';
    const enabled = t.features ? Object.values(t.features).filter(Boolean).length : 0;
    const total   = t.features ? Object.keys(t.features).length : 0;
    const stateClass = (t.state || '').toLowerCase();
    card.innerHTML = `
      <div class="lff-tenant-name">${escHtml(t.ent?.name || 'Unknown')}</div>
      <div class="lff-tenant-meta">ID: <span class="lff-mono">${escHtml(t.ent?.id)}</span></div>
      <div class="lff-tenant-meta">Type: ${escHtml(t.ent?.type)}</div>
      <div class="lff-tenant-meta">State: <span class="lff-state lff-state-${stateClass}">${escHtml(t.state)}</span></div>
      <div class="lff-tenant-meta">Perms: <span class="lff-perm">${escHtml(t.permissions)}</span></div>
      <div class="lff-flags-count">${enabled} / ${total} flags enabled</div>
    `;
    return card;
  }

  function buildSection(tenancies, title) {
    if (!tenancies || tenancies.length === 0) return null;
    const allFlags = getAllFlagNames(tenancies);
    if (allFlags.length === 0) return null;

    const section = document.createElement('div');
    section.className = 'lff-section';

    const h2 = document.createElement('h2');
    h2.textContent = title;
    section.appendChild(h2);

    const summary = document.createElement('div');
    summary.className = 'lff-tenant-summary';
    tenancies.forEach(t => summary.appendChild(buildTenantCard(t)));
    section.appendChild(summary);

    const tableWrap = document.createElement('div');
    tableWrap.className = 'lff-table-wrap';

    const table = document.createElement('table');
    table.className = 'lff-table';

    // Header
    const thead = document.createElement('thead');
    const hRow = document.createElement('tr');
    const thFlag = document.createElement('th');
    thFlag.className = 'lff-th-flag';
    thFlag.textContent = 'Feature Flag';
    hRow.appendChild(thFlag);
    tenancies.forEach(t => {
      const th = document.createElement('th');
      th.className = 'lff-th-tenant';
      th.innerHTML = `<span class="lff-th-name">${escHtml(t.ent?.name || 'Unknown')}</span>`;
      hRow.appendChild(th);
    });
    thead.appendChild(hRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    allFlags.forEach((flag, i) => {
      const tr = document.createElement('tr');
      tr.className = i % 2 === 0 ? 'lff-row-even' : 'lff-row-odd';
      tr.dataset.flag = flag;

      const tdFlag = document.createElement('td');
      tdFlag.className = 'lff-flag-name';
      tdFlag.textContent = flag;
      tr.appendChild(tdFlag);

      let allSame = true;
      const firstVal = t => t.features?.[flag];
      const refVal = firstVal(tenancies[0]);

      tenancies.forEach(t => {
        const td = document.createElement('td');
        td.className = 'lff-flag-value';
        const val = t.features ? t.features[flag] : undefined;

        if (val !== refVal) allSame = false;

        if (val === true) {
          td.innerHTML = '<span class="lff-badge lff-on">ON</span>';
          td.classList.add('lff-cell-on');
        } else if (val === false) {
          td.innerHTML = '<span class="lff-badge lff-off">OFF</span>';
        } else {
          td.innerHTML = '<span class="lff-badge lff-na">—</span>';
        }
        tr.appendChild(td);
      });

      if (!allSame) tr.dataset.diff = '1';
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrap.appendChild(table);
    section.appendChild(tableWrap);
    return section;
  }

  function buildUI(data, rawJson) {
    const root = document.createElement('div');
    root.id = 'lff-root';

    // Header
    const header = document.createElement('div');
    header.id = 'lff-header';
    header.innerHTML = `
      <div id="lff-title">
        <span id="lff-logo">🔍</span>
        Lookout Feature Flags
        <span id="lff-url">${escHtml(window.location.pathname)}</span>
      </div>
      <div id="lff-controls">
        <input id="lff-search" type="text" placeholder="Search flags…" autocomplete="off" spellcheck="false" />
        <label class="lff-check"><input type="checkbox" id="lff-diff-only" /> Diff only</label>
        <label class="lff-check"><input type="checkbox" id="lff-on-only" /> Enabled only</label>
        <button id="lff-collapse-btn">Collapse</button>
        <button id="lff-json-btn">Raw JSON</button>
      </div>
    `;
    root.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.id = 'lff-body';

    const tenancySection = buildSection(data.tenancies || [], 'Tenancies');
    if (tenancySection) body.appendChild(tenancySection);

    const orgSection = buildSection(data.org_tenancies || [], 'Org Tenancies');
    if (orgSection) body.appendChild(orgSection);

    if (!tenancySection && !orgSection) {
      body.innerHTML = '<p style="padding:24px;color:#718096">No tenancy feature flag data found in response.</p>';
    }
    root.appendChild(body);

    // Raw JSON modal
    const modal = document.createElement('div');
    modal.id = 'lff-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div id="lff-modal-inner">
        <div id="lff-modal-bar">
          <span>Raw JSON</span>
          <button id="lff-modal-close">✕ Close</button>
        </div>
        <pre id="lff-modal-pre">${escHtml(rawJson)}</pre>
      </div>
    `;
    root.appendChild(modal);

    return root;
  }

  function wireEvents(root) {
    const search      = root.querySelector('#lff-search');
    const diffOnly    = root.querySelector('#lff-diff-only');
    const onOnly      = root.querySelector('#lff-on-only');
    const collapseBtn = root.querySelector('#lff-collapse-btn');
    const jsonBtn     = root.querySelector('#lff-json-btn');
    const modal       = root.querySelector('#lff-modal');
    const modalClose  = root.querySelector('#lff-modal-close');

    function applyFilters() {
      const term = search.value.toLowerCase().trim();
      const diff = diffOnly.checked;
      const on   = onOnly.checked;

      root.querySelectorAll('.lff-table tbody tr').forEach(tr => {
        const flag = (tr.dataset.flag || '').toLowerCase();
        let show = !term || flag.includes(term);
        if (show && diff)  show = tr.dataset.diff === '1';
        if (show && on)    show = !!tr.querySelector('.lff-on');
        tr.hidden = !show;
      });
    }

    search.addEventListener('input', applyFilters);
    diffOnly.addEventListener('change', applyFilters);
    onOnly.addEventListener('change', applyFilters);

    let collapsed = false;
    collapseBtn.addEventListener('click', () => {
      collapsed = !collapsed;
      root.querySelectorAll('.lff-table-wrap, .lff-tenant-summary').forEach(el => {
        el.hidden = collapsed;
      });
      collapseBtn.textContent = collapsed ? 'Expand' : 'Collapse';
    });

    jsonBtn.addEventListener('click', () => { modal.hidden = false; });
    modalClose.addEventListener('click', () => { modal.hidden = true; });
    modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
  }

  async function init() {
    const data = await fetchData();
    if (!data) return;
    if (!Array.isArray(data.tenancies) && !Array.isArray(data.org_tenancies)) return;

    // Hide whatever Chrome rendered
    document.body.style.cssText = 'margin:0;padding:0;background:#0f1117';
    const pre = document.querySelector('pre');
    if (pre) pre.hidden = true;

    const rawJson = JSON.stringify(data, null, 2);
    const ui = buildUI(data, rawJson);
    document.body.appendChild(ui);
    wireEvents(ui);
  }

  init();
})();
