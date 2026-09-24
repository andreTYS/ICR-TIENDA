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
      <div class="card">
        <div class="thumb">
          ${p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre}" loading="lazy" />` : '<span class="no-img">Sin imagen</span>'}
        </div>
        <div class="body">
          <p class="name">${p.nombre}</p>
          <p class="meta">${p.categoria_producto || 'Sin categoría'}${p.referencia_interna ? ' · ' + p.referencia_interna : ''}</p>
          ${p.precio_venta ? `<p class="price">${money(p.precio_venta)}</p>` : ''}
        </div>
      </div>
    `)
    .join('');

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

    loadProducts();
  } catch (err) {
    formMsg.textContent = err.message;
    formMsg.className = 'form-msg err';
  } finally {
    submitBtn.disabled = false;
  }
});

loadProducts();
