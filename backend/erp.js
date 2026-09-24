// Cliente del ERP de ICR (icr-almacen-mvp, https://erp.inversionesicr.com).
//
// Se autentica con un token de servicio del ERP (Administración → Tokens de
// servicio, prefijo "icr_"), que actúa como un usuario del ERP y hereda sus
// permisos. El usuario necesita: inventory.stock.get (stock), crm.manage
// (crear leads) y store.query (ventas de tienda, para "más vendidos").
//
// Sin ERP_API_TOKEN la tienda funciona igual: el stock se muestra como
// "Consultar disponibilidad" y las cotizaciones se guardan solo en la base
// local (quedan pendientes de envío y se reintentan desde /admin).

const ERP_API_URL = (process.env.ERP_API_URL || 'https://erp.inversionesicr.com/api').replace(/\/+$/, '');
const ERP_API_TOKEN = process.env.ERP_API_TOKEN || '';
const STOCK_TTL_MS = Number(process.env.ERP_STOCK_TTL_SECONDS || 120) * 1000;
const TIMEOUT_MS = 10000;

const configured = () => Boolean(ERP_API_TOKEN);

async function erpFetch(path, { method = 'GET', body } = {}) {
  if (!configured()) {
    const err = new Error('ERP no configurado (falta ERP_API_TOKEN)');
    err.code = 'ERP_NOT_CONFIGURED';
    throw err;
  }
  const res = await fetch(`${ERP_API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ERP_API_TOKEN}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* respuesta no JSON */
  }
  if (!res.ok || json?.status !== 'success') {
    const err = new Error(json?.error?.message || `El ERP respondió HTTP ${res.status}`);
    err.code = json?.error?.code || `HTTP_${res.status}`;
    throw err;
  }
  return json.data;
}

// Clave de cruce entre tienda y ERP: referencia_interna (tienda) = sku (ERP);
// si el producto no tiene referencia, se cruza por nombre normalizado.
const norm = (s) => (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '');

// ---------- Stock: mapa completo en caché (evita un request al ERP por producto) ----------
let stockCache = { at: 0, bySku: new Map(), byName: new Map(), error: null };
let stockLoading = null;

async function loadStock() {
  const bySku = new Map();
  const byName = new Map();
  const pageSize = 500;
  for (let page = 1; page <= 40; page++) {
    const data = await erpFetch(`/inventory/stock?page=${page}&page_size=${pageSize}`);
    for (const row of data.items || []) {
      const disponible = Number(row.stock_disponible) || 0;
      const k1 = norm(row.sku);
      const k2 = norm(row.producto_nombre);
      if (k1) bySku.set(k1, (bySku.get(k1) || 0) + disponible);
      if (k2) byName.set(k2, (byName.get(k2) || 0) + disponible);
    }
    if (page * pageSize >= (data.total || 0)) break;
  }
  return { bySku, byName };
}

async function getStockMap() {
  if (!configured()) return null;
  const fresh = Date.now() - stockCache.at < STOCK_TTL_MS;
  if (fresh) return stockCache;
  if (!stockLoading) {
    stockLoading = loadStock()
      .then(({ bySku, byName }) => {
        stockCache = { at: Date.now(), bySku, byName, error: null };
      })
      .catch((err) => {
        console.error('ERP: no se pudo leer el stock:', err.message);
        // Reintenta en 30 s en vez de martillar al ERP en cada request
        stockCache = { ...stockCache, at: Date.now() - STOCK_TTL_MS + 30000, error: err.message };
      })
      .finally(() => {
        stockLoading = null;
      });
  }
  // Primera carga: espera; luego sirve el caché viejo mientras se refresca
  if (stockCache.at === 0) await stockLoading;
  return stockCache;
}

// Devuelve el stock disponible del producto en el ERP, o null si no se conoce.
function stockFor(map, producto) {
  if (!map || (map.bySku.size === 0 && map.byName.size === 0)) return null;
  const k1 = norm(producto.referencia_interna);
  if (k1 && map.bySku.has(k1)) return map.bySku.get(k1);
  const k2 = norm(producto.nombre);
  if (k2 && map.byName.has(k2)) return map.byName.get(k2);
  if (k2 && map.bySku.has(k2)) return map.bySku.get(k2);
  return null;
}

// ---------- CRM: cada solicitud de cotización de la tienda es un lead en el ERP ----------
async function crearLead({ contacto, empresa, correo, telefono, total, notas }) {
  const data = await erpFetch('/crm/leads', {
    method: 'POST',
    body: {
      nombre_contacto: contacto,
      empresa: empresa || null,
      email: correo || null,
      telefono: telefono || null,
      origen: 'WEB',
      monto_estimado: total || null,
      moneda: 'PEN',
      notas,
      channel: 'api',
    },
  });
  return data.lead;
}

// ---------- Más vendidos: ventas de tienda registradas en el ERP ----------
async function ventasPorSku(dias = 365) {
  const desde = new Date(Date.now() - dias * 864e5).toISOString().slice(0, 10);
  const conteo = new Map();
  for (let page = 1; page <= 10; page++) {
    const data = await erpFetch(`/store/sales?desde=${desde}&page=${page}&page_size=200`);
    for (const v of data.items || []) {
      if (!v.sku) continue;
      const k = norm(v.sku);
      conteo.set(k, (conteo.get(k) || 0) + Number(v.cantidad || 0));
    }
    if (page * 200 >= (data.total || 0)) break;
  }
  return conteo;
}

async function status() {
  if (!configured()) return { configurado: false, url: ERP_API_URL };
  try {
    const me = await erpFetch('/auth/me');
    const map = await getStockMap();
    return {
      configurado: true,
      conectado: true,
      url: ERP_API_URL,
      usuario: me?.nombre_completo || me?.nombre || me?.email || null,
      rol: me?.rol_codigo || null,
      productos_con_stock: map ? map.bySku.size : 0,
      error_stock: map?.error || null,
    };
  } catch (err) {
    return { configurado: true, conectado: false, url: ERP_API_URL, error: err.message };
  }
}

module.exports = { configured, getStockMap, stockFor, crearLead, ventasPorSku, status, norm, ERP_API_URL };
