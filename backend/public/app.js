const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('imagen');
const dzEmpty = document.getElementById('dz-empty');
const dzPreview = document.getElementById('dz-preview');
const form = document.getElementById('product-form');
const submitBtn = document.getElementById('submit-btn');
const formMsg = document.getElementById('form-msg');
const grid = document.getElementById('grid');
const countBadge = document.getElementById('count-badge');

let selectedFile = null;

function setPreview(file) {
  selectedFile = file;
  const url = URL.createObjectURL(file);
  dzPreview.src = url;
  dzPreview.hidden = false;
  dzEmpty.hidden = true;
}

dropzone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) setPreview(fileInput.files[0]);
});

['dragenter', 'dragover'].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  })
);

['dragleave', 'drop'].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
  })
);

dropzone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    fileInput.files = e.dataTransfer.files;
    setPreview(file);
  }
});

// Todo lo que viene de la base se escapa: las solicitudes llegan de un formulario público
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function money(n) {
  if (n === null || n === undefined || n === '') return '';
  return 'S/ ' + Number(n).toFixed(2);
}

const searchInput = document.getElementById('search');
const paginationEl = document.getElementById('pagination');

let currentPage = 1;
let currentQuery = '';
const PAGE_SIZE = 60;
let searchTimer = null;

async function loadProducts(page = 1) {
  currentPage = page;
  const params = new URLSearchParams({ page, pageSize: PAGE_SIZE });
  if (currentQuery) params.set('q', currentQuery);

  const res = await fetch(`/api/productos?${params.toString()}`);
  const data = await res.json();
  const { productos, total, totalPages } = data;

  countBadge.textContent = `${total} producto${total === 1 ? '' : 's'}`;

  if (productos.length === 0) {
    grid.innerHTML = '<div class="empty-state">No se encontraron productos.</div>';
    paginationEl.innerHTML = '';
    return;
  }

  grid.innerHTML = productos
    .map((p) => `
      <div class="card ${p.publicado ? '' : 'oculto'}">
        <div class="thumb">
          ${p.imagen_url ? `<img src="${esc(p.imagen_url)}" alt="${esc(p.nombre)}" loading="lazy" />` : '<span class="no-img">Sin imagen</span>'}
          <div class="actions">
            <button class="act ${p.destacado ? 'on' : ''}" title="Destacar en portada" data-id="${p.id}" data-campo="destacado" data-valor="${!p.destacado}">★</button>
            <button class="act ${p.publicado ? '' : 'on'}" title="${p.publicado ? 'Ocultar de la tienda' : 'Mostrar en la tienda'}" data-id="${p.id}" data-campo="publicado" data-valor="${!p.publicado}">👁</button>
          </div>
        </div>
        <div class="body">
          <p class="name">${esc(p.nombre)}</p>
          <p class="meta">${esc(p.categoria_producto || 'Sin categoría')}${p.referencia_interna ? ' · ' + esc(p.referencia_interna) : ''}</p>
          ${p.precio_venta ? `<p class="price">${money(p.precio_venta)}</p>` : ''}
          <p class="stock">${p.stock_erp == null ? 'Sin dato en ERP' : `Stock ERP: ${p.stock_erp}`}${p.publicado ? '' : ' · Oculto'}</p>
        </div>
      </div>
    `)
    .join('');

  grid.querySelectorAll('.act').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await fetch(`/api/productos/${btn.dataset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [btn.dataset.campo]: btn.dataset.valor === 'true' }),
      });
      loadProducts(currentPage);
    });
  });

  renderPagination(currentPage, totalPages);
}

function renderPagination(page, totalPages) {
  if (totalPages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }

  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  let html = `<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">‹</button>`;
  let last = 0;
  for (const p of sorted) {
    if (last && p - last > 1) html += `<span class="dots">…</span>`;
    html += `<button class="${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
    last = p;
  }
  html += `<button ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">›</button>`;

  paginationEl.innerHTML = html;
  paginationEl.querySelectorAll('button[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => loadProducts(Number(btn.dataset.page)));
  });
}

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentQuery = searchInput.value.trim();
    loadProducts(1);
  }, 300);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  formMsg.textContent = 'Guardando...';
  formMsg.className = 'form-msg';

  const data = new FormData(form);
  if (selectedFile) data.set('imagen', selectedFile);

  try {
    const res = await fetch('/api/productos', { method: 'POST', body: data });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Error al guardar');

    formMsg.textContent = `"${result.nombre}" guardado correctamente.`;
    formMsg.className = 'form-msg ok';

    form.reset();
    selectedFile = null;
    dzPreview.hidden = true;
    dzEmpty.hidden = false;

    // ---------- Pestañas ----------
document.querySelectorAll('.tab').forEach((t) => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
    document.getElementById('tab-catalogo').hidden = t.dataset.tab !== 'catalogo';
    document.getElementById('tab-solicitudes').hidden = t.dataset.tab !== 'solicitudes';
    if (t.dataset.tab === 'solicitudes') loadSolicitudes();
  });
});

// ---------- Estado del ERP ----------
async function loadErp() {
  const el = document.getElementById('erp-status');
  try {
    const s = await (await fetch('/api/admin/erp')).json();
    if (!s.configurado) {
      el.className = 'erp-status warn';
      el.textContent = 'ERP no configurado: define ERP_API_TOKEN en el .env del VPS para ver stock y enviar leads.';
    } else if (!s.conectado) {
      el.className = 'erp-status err';
      el.textContent = `ERP sin conexión (${s.url}): ${s.error}`;
    } else {
      el.className = 'erp-status ok';
      el.innerHTML = `ERP conectado · ${esc(s.url)} · usuario <b>${esc(s.usuario)}</b> (${esc(s.rol)}) · ${s.productos_con_stock} SKU con stock`;
    }
  } catch {
    el.className = 'erp-status err';
    el.textContent = 'No se pudo consultar el estado del ERP';
  }
}

// ---------- Solicitudes de cotización ----------
async function loadSolicitudes() {
  const el = document.getElementById('solicitudes');
  const { solicitudes } = await (await fetch('/api/admin/cotizaciones')).json();
  const pendientes = solicitudes.filter((s) => !s.erp_lead).length;
  document.getElementById('sol-badge').textContent = solicitudes.length ? `${solicitudes.length}${pendientes ? ` · ${pendientes} sin ERP` : ''}` : '';
  if (!solicitudes.length) {
    el.innerHTML = '<div class="empty-state">Aún no hay solicitudes desde la tienda.</div>';
    return;
  }
  el.innerHTML = solicitudes
    .map((s) => `
      <article class="sol">
        <header>
          <b>${esc(s.codigo)}</b>
          <span>${new Date(s.creado_en).toLocaleString('es-PE')}</span>
          ${s.erp_lead
            ? `<span class="pill ok">ERP ${esc(s.erp_lead)}</span>`
            : `<span class="pill err" title="${esc(s.erp_error || 'ERP no configurado')}">Sin enviar al ERP</span>
               <button class="reenviar" data-id="${s.id}">Reenviar</button>`}
        </header>
        <p><b>${esc(s.contacto)}</b>${s.empresa ? ' · ' + esc(s.empresa) : ''} · ${esc(s.correo)}${s.telefono ? ' · ' + esc(s.telefono) : ''}${s.ciudad ? ' · ' + esc(s.ciudad) : ''}</p>
        <ul>${s.items.map((i) => `<li>${i.cantidad} × ${esc(i.nombre)}${i.referencia ? ` <small>[${esc(i.referencia)}]</small>` : ''} — ${money(i.subtotal)}</li>`).join('')}</ul>
        <p class="total">Total referencial: ${money(s.total)}</p>
      </article>`)
    .join('');
  el.querySelectorAll('.reenviar').forEach((b) =>
    b.addEventListener('click', async () => {
      b.disabled = true;
      b.textContent = 'Enviando…';
      await fetch(`/api/admin/cotizaciones/${b.dataset.id}/reenviar`, { method: 'POST' });
      loadSolicitudes();
    })
  );
}

loadProducts();
loadErp();
loadSolicitudes();
  } catch (err) {
    formMsg.textContent = err.message;
    formMsg.className = 'form-msg err';
  } finally {
    submitBtn.disabled = false;
  }
});

// ---------- Pestañas ----------
document.querySelectorAll('.tab').forEach((t) => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
    document.getElementById('tab-catalogo').hidden = t.dataset.tab !== 'catalogo';
    document.getElementById('tab-solicitudes').hidden = t.dataset.tab !== 'solicitudes';
    if (t.dataset.tab === 'solicitudes') loadSolicitudes();
  });
});

// ---------- Estado del ERP ----------
async function loadErp() {
  const el = document.getElementById('erp-status');
  try {
    const s = await (await fetch('/api/admin/erp')).json();
    if (!s.configurado) {
      el.className = 'erp-status warn';
      el.textContent = 'ERP no configurado: define ERP_API_TOKEN en el .env del VPS para ver stock y enviar leads.';
    } else if (!s.conectado) {
      el.className = 'erp-status err';
      el.textContent = `ERP sin conexión (${s.url}): ${s.error}`;
    } else {
      el.className = 'erp-status ok';
      el.innerHTML = `ERP conectado · ${esc(s.url)} · usuario <b>${esc(s.usuario)}</b> (${esc(s.rol)}) · ${s.productos_con_stock} SKU con stock`;
    }
  } catch {
    el.className = 'erp-status err';
    el.textContent = 'No se pudo consultar el estado del ERP';
  }
}

// ---------- Solicitudes de cotización ----------
async function loadSolicitudes() {
  const el = document.getElementById('solicitudes');
  const { solicitudes } = await (await fetch('/api/admin/cotizaciones')).json();
  const pendientes = solicitudes.filter((s) => !s.erp_lead).length;
  document.getElementById('sol-badge').textContent = solicitudes.length ? `${solicitudes.length}${pendientes ? ` · ${pendientes} sin ERP` : ''}` : '';
  if (!solicitudes.length) {
    el.innerHTML = '<div class="empty-state">Aún no hay solicitudes desde la tienda.</div>';
    return;
  }
  el.innerHTML = solicitudes
    .map((s) => `
      <article class="sol">
        <header>
          <b>${esc(s.codigo)}</b>
          <span>${new Date(s.creado_en).toLocaleString('es-PE')}</span>
          ${s.erp_lead
            ? `<span class="pill ok">ERP ${esc(s.erp_lead)}</span>`
            : `<span class="pill err" title="${esc(s.erp_error || 'ERP no configurado')}">Sin enviar al ERP</span>
               <button class="reenviar" data-id="${s.id}">Reenviar</button>`}
        </header>
        <p><b>${esc(s.contacto)}</b>${s.empresa ? ' · ' + esc(s.empresa) : ''} · ${esc(s.correo)}${s.telefono ? ' · ' + esc(s.telefono) : ''}${s.ciudad ? ' · ' + esc(s.ciudad) : ''}</p>
        <ul>${s.items.map((i) => `<li>${i.cantidad} × ${esc(i.nombre)}${i.referencia ? ` <small>[${esc(i.referencia)}]</small>` : ''} — ${money(i.subtotal)}</li>`).join('')}</ul>
        <p class="total">Total referencial: ${money(s.total)}</p>
      </article>`)
    .join('');
  el.querySelectorAll('.reenviar').forEach((b) =>
    b.addEventListener('click', async () => {
      b.disabled = true;
      b.textContent = 'Enviando…';
      await fetch(`/api/admin/cotizaciones/${b.dataset.id}/reenviar`, { method: 'POST' });
      loadSolicitudes();
    })
  );
}

loadProducts();
loadErp();
loadSolicitudes();
