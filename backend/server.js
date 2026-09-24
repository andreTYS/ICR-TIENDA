require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Pool } = require('pg');
const erp = require('./erp');

const app = express();
const PORT = process.env.PORT || 4000;

// ---------- Conexión a PostgreSQL ----------
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

// Crea/actualiza las tablas (idempotente: se corre en cada arranque)
async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS productos (
      id                  SERIAL PRIMARY KEY,
      costo               NUMERIC(12,2),
      nombre              TEXT NOT NULL,
      precio_venta        NUMERIC(12,2),
      referencia_interna  TEXT,
      unidad_medida       TEXT,
      categoria_producto  TEXT,
      archivo_imagen      TEXT,
      imagen_url          TEXT,
      creado_en           TIMESTAMP DEFAULT NOW()
    );
    ALTER TABLE productos ADD COLUMN IF NOT EXISTS destacado BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE productos ADD COLUMN IF NOT EXISTS publicado BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE productos ADD COLUMN IF NOT EXISTS descripcion TEXT;

    CREATE SEQUENCE IF NOT EXISTS solicitud_numero_seq;
    CREATE TABLE IF NOT EXISTS solicitudes_cotizacion (
      id             SERIAL PRIMARY KEY,
      codigo         TEXT UNIQUE NOT NULL,
      empresa        TEXT,
      contacto       TEXT NOT NULL,
      correo         TEXT NOT NULL,
      telefono       TEXT,
      ciudad         TEXT,
      consumo_kwh    TEXT,
      tipo_cliente   TEXT,
      items          JSONB NOT NULL,
      total          NUMERIC(12,2),
      erp_lead       TEXT,
      erp_error      TEXT,
      erp_enviado_en TIMESTAMP,
      creado_en      TIMESTAMP DEFAULT NOW()
    );
  `);
}

// ---------- Catálogo: marcas y soluciones derivadas de los datos existentes ----------
const MARCAS = [
  'VICTRON ENERGY', 'VICTRON', 'HIKVISION', 'DAHUA', 'DEYE', 'GROWATT', 'HUAWEI', 'FRONIUS', 'SOLIS', 'GOODWE',
  'GOSPOWER', 'FELICITY', 'PYLONTECH', 'DYNESS', 'JINKO', 'JA SOLAR', 'CANADIAN', 'HOYMILES', 'RISCO', 'MIRCOM',
  'ZKTECO', 'TP-LINK', 'EZVIZ', 'IMOU', 'HOBER', 'CARLO GAVAZZI', 'BSL', 'FORZA', 'DIMAX', 'EPEVER', 'MUSTSOLAR',
  'AE SOLAR', 'LONGI', 'TRINA', 'SMA', 'SCHNEIDER', 'SUNGROW',
];
const MARCA_POR_PREFIJO = [
  ['HK-', 'HIKVISION'],
  ['ZK', 'ZKTECO'],
  ['TP-', 'TP-LINK'],
];
function marcaDe(p) {
  const texto = `${p.nombre} ${p.referencia_interna || ''}`.toUpperCase();
  const m = MARCAS.find((b) => texto.includes(b));
  if (m) return m === 'VICTRON' ? 'VICTRON ENERGY' : m;
  if (/BLUESOLAR|SMARTSOLAR|MULTIPLUS|VE\.DIRECT|VEDIRECT/.test(texto)) return 'VICTRON ENERGY';
  if (texto.includes('HUAWEY')) return 'HUAWEI';
  const ref = (p.referencia_interna || p.nombre || '').toUpperCase();
  const pref = MARCA_POR_PREFIJO.find(([pre]) => ref.startsWith(pre));
  return pref ? pref[1] : null;
}

// Mismas soluciones que usa el frontend (src/data/products.ts), mapeadas a las
// categorías reales de la base.
const SOLUCIONES = {
  respaldo: ['BATERIAS', 'INVERSORES HIBRIDOS', 'INVERSORES', 'UPS', 'TABLEROS'],
  autoconsumo: ['PANELES', 'INVERSORES DE RED', 'MICROINVERSOR', 'ESTRUCTURA', 'CABLES PARA PANEL SOLAR', 'SMART METER'],
  offgrid: ['CONTROLADORES', 'BATERIAS', 'INVERSORES', 'PANELES', 'BOMBAS', 'INVERSORES HIBRIDOS'],
  monitoreo: ['SMART METER', 'NETWORKING', 'CABLES DE COMUNICACION'],
};
const solucionesDe = (cat) => Object.entries(SOLUCIONES).filter(([, cats]) => cats.includes(cat)).map(([id]) => id);

// Filtro de lo que se muestra en la tienda pública
const PUBLICO_SQL = `publicado = true AND COALESCE(precio_venta,0) > 0 AND COALESCE(categoria_producto,'') NOT ILIKE 'REVISAR%'`;

function toPublic(p, stockMap) {
  const stock = erp.stockFor(stockMap, p);
  return {
    id: p.id,
    nombre: p.nombre,
    referencia_interna: p.referencia_interna,
    categoria_producto: p.categoria_producto,
    unidad_medida: p.unidad_medida,
    precio_venta: p.precio_venta != null ? Number(p.precio_venta) : null,
    descripcion: p.descripcion || null,
    destacado: p.destacado,
    publicado: p.publicado,
    archivo_imagen: p.archivo_imagen,
    // Las URLs guardadas pueden venir del import local (http://localhost:3000/uploads/...).
    // Siempre se devuelven relativas para que funcionen detrás de cualquier dominio.
    imagen_url: p.archivo_imagen ? `/uploads/${p.archivo_imagen}` : p.imagen_url,
    marca: marcaDe(p),
    soluciones: solucionesDe(p.categoria_producto),
    stock_erp: stock,
    creado_en: p.creado_en,
  };
}

// ---------- Protección del panel de administración ----------
// Basic Auth para /admin y para las rutas de escritura. Si ADMIN_PASSWORD no
// está definido (solo en local) el panel queda abierto.
function requireAdmin(req, res, next) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return next();
  const user = process.env.ADMIN_USER || 'admin';
  const [scheme, encoded] = (req.headers.authorization || '').split(' ');
  if (scheme === 'Basic' && encoded) {
    const [u, ...rest] = Buffer.from(encoded, 'base64').toString().split(':');
    const given = Buffer.from(`${u}:${rest.join(':')}`);
    const expected = Buffer.from(`${user}:${password}`);
    if (given.length === expected.length && crypto.timingSafeEqual(given, expected)) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Admin productos ICR"');
  res.status(401).send('Autenticación requerida');
}

// Límite simple por IP para el formulario público de cotización
const hits = new Map();
function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (list.length >= max) {
      return res.status(429).json({ error: 'Demasiadas solicitudes, intenta de nuevo en unos minutos' });
    }
    list.push(now);
    hits.set(key, list);
    next();
  };
}

// ---------- Carpeta local de imágenes ----------
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const unique = crypto.randomBytes(8).toString('hex');
    const base = (req.body.referencia_interna || req.body.nombre || 'producto')
      .toString()
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .slice(0, 40);
    cb(null, `${base}_${unique}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ok = /image\/(jpeg|png|webp|gif)/.test(file.mimetype);
    cb(ok ? null : new Error('Solo se permiten imágenes (jpg, png, webp, gif)'), ok);
  },
});

app.set('trust proxy', true);
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));
app.get('/admin', (req, res, next) => (req.path === '/admin' ? res.redirect(301, '/admin/') : next()));
app.use('/admin', requireAdmin, express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.redirect('/admin/'));

// ---------- API: listar productos (con paginación y filtros) ----------
// ?tienda=1 aplica el filtro público (con precio, publicado). El panel /admin lo omite.
app.get('/api/productos', async (req, res) => {
  try {
    const pageSize = Math.min(parseInt(req.query.pageSize) || 60, 200);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * pageSize;

    const params = [];
    const conds = [];
    if (req.query.tienda) conds.push(PUBLICO_SQL);

    const search = (req.query.q || '').trim();
    if (search) {
      params.push(`%${search}%`);
      conds.push(`(nombre ILIKE $${params.length} OR referencia_interna ILIKE $${params.length} OR categoria_producto ILIKE $${params.length})`);
    }
    const cats = (req.query.cat || '').split(',').map((c) => c.trim()).filter(Boolean);
    if (cats.length) {
      params.push(cats);
      conds.push(`categoria_producto = ANY($${params.length})`);
    }
    const solucion = SOLUCIONES[req.query.solucion];
    if (solucion) {
      params.push(solucion);
      conds.push(`categoria_producto = ANY($${params.length})`);
    }
    const marcas = (req.query.marca || '').split(',').map((m) => m.trim().toUpperCase()).filter(Boolean);
    if (marcas.length) {
      const ors = marcas.map((m) => {
        params.push(`%${m}%`);
        const i = params.length;
        const prefijos = MARCA_POR_PREFIJO.filter(([, b]) => b === m).map(([pre]) => {
          params.push(`${pre}%`);
          return ` OR referencia_interna ILIKE $${params.length}`;
        });
        return `(nombre ILIKE $${i} OR referencia_interna ILIKE $${i}${prefijos.join('')})`;
      });
      conds.push(`(${ors.join(' OR ')})`);
    }
    const min = parseFloat(req.query.min);
    const max = parseFloat(req.query.max);
    if (!Number.isNaN(min)) { params.push(min); conds.push(`precio_venta >= $${params.length}`); }
    if (!Number.isNaN(max)) { params.push(max); conds.push(`precio_venta <= $${params.length}`); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const orden = {
      precio_asc: 'precio_venta ASC NULLS LAST, id',
      precio_desc: 'precio_venta DESC NULLS LAST, id',
      nombre: 'nombre ASC, id',
    }[req.query.sort] ||
      // Relevancia: destacados, luego las líneas de energía (el giro principal), luego el resto
      `destacado DESC, (categoria_producto = ANY('{${[...new Set(Object.values(SOLUCIONES).flat())].map((c) => `"${c}"`).join(',')}}')) DESC, id`;

    const totalResult = await pool.query(`SELECT count(*)::int AS total FROM productos ${where}`, params);
    const total = totalResult.rows[0].total;

    params.push(pageSize, offset);
    const { rows } = await pool.query(
      `SELECT * FROM productos ${where} ORDER BY ${orden} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const stockMap = await erp.getStockMap().catch(() => null);
    res.json({
      productos: rows.map((p) => toPublic(p, stockMap)),
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo leer la base de datos' });
  }
});

// ---------- API: categorías y marcas con conteo (filtros del catálogo) ----------
app.get('/api/categorias', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT categoria_producto AS nombre, count(*)::int AS n FROM productos
       WHERE ${PUBLICO_SQL} AND categoria_producto IS NOT NULL
       GROUP BY 1 ORDER BY n DESC, nombre`
    );
    const todos = await pool.query(`SELECT nombre, referencia_interna FROM productos WHERE ${PUBLICO_SQL}`);
    const conteo = new Map();
    for (const p of todos.rows) {
      const m = marcaDe(p);
      if (m) conteo.set(m, (conteo.get(m) || 0) + 1);
    }
    const marcas = [...conteo.entries()].map(([nombre, n]) => ({ nombre, n })).sort((a, b) => b.n - a.n);
    res.json({ categorias: rows, marcas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo leer la base de datos' });
  }
});

// ---------- API: portada (destacados y más vendidos) ----------
app.get('/api/destacados', async (req, res) => {
  try {
    const n = Math.min(parseInt(req.query.n) || 3, 12);
    const stockMap = await erp.getStockMap().catch(() => null);

    // Destacados: los marcados en /admin; si no hay, los de mayor precio de las líneas principales
    let { rows: destacados } = await pool.query(
      `SELECT * FROM productos WHERE ${PUBLICO_SQL} AND destacado ORDER BY creado_en DESC LIMIT $1`, [n]
    );
    if (destacados.length === 0) {
      // Uno por línea principal: con stock en el ERP primero, y de precio típico
      // de su categoría (no el más caro ni el más barato)
      const { rows } = await pool.query(
        `WITH p AS (SELECT * FROM productos WHERE ${PUBLICO_SQL} AND categoria_producto = ANY($1)),
              med AS (SELECT categoria_producto, percentile_cont(0.5) WITHIN GROUP (ORDER BY precio_venta) AS m
                      FROM p GROUP BY 1)
         SELECT p.*, abs(p.precio_venta - med.m) AS dist FROM p JOIN med USING (categoria_producto)`,
        [['INVERSORES HIBRIDOS', 'BATERIAS', 'PANELES']]
      );
      const porCat = new Map();
      for (const p of rows) {
        const stock = erp.stockFor(stockMap, p) > 0 ? 0 : 1;
        const key = [stock, Number(p.dist)];
        const actual = porCat.get(p.categoria_producto);
        if (!actual || key[0] < actual.key[0] || (key[0] === actual.key[0] && key[1] < actual.key[1])) {
          porCat.set(p.categoria_producto, { key, p });
        }
      }
      destacados = [...porCat.values()].map((x) => x.p).slice(0, n);
    }

    // Más vendidos: según las ventas de tienda registradas en el ERP (últimos 12 meses)
    let masVendidos = [];
    let fuente = 'catalogo';
    if (erp.configured()) {
      try {
        const ventas = await erp.ventasPorSku(365);
        if (ventas.size) {
          const { rows } = await pool.query(`SELECT * FROM productos WHERE ${PUBLICO_SQL} AND referencia_interna IS NOT NULL`);
          masVendidos = rows
            .map((p) => ({ p, v: ventas.get(erp.norm(p.referencia_interna)) || 0 }))
            .filter((x) => x.v > 0)
            .sort((a, b) => b.v - a.v)
            .slice(0, n)
            .map((x) => ({ ...x.p, vendidos: x.v }));
          if (masVendidos.length) fuente = 'erp';
        }
      } catch (err) {
        console.error('ERP: no se pudieron leer las ventas:', err.message);
      }
    }
    if (masVendidos.length === 0) {
      ({ rows: masVendidos } = await pool.query(
        `SELECT DISTINCT ON (categoria_producto) * FROM productos
         WHERE ${PUBLICO_SQL} AND categoria_producto = ANY($1)
         ORDER BY categoria_producto, precio_venta ASC LIMIT $2`,
        [['CONTROLADORES', 'INVERSORES', 'CABLES PARA PANEL SOLAR'], n]
      ));
    }

    res.json({
      destacados: destacados.map((p) => toPublic(p, stockMap)),
      masVendidos: masVendidos.map((p) => ({ ...toPublic(p, stockMap), vendidos: p.vendidos || null })),
      fuenteMasVendidos: fuente,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo leer la base de datos' });
  }
});

// ---------- API: ficha de un producto ----------
app.get('/api/productos/:id(\\d+)', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM productos WHERE id = $1 AND ${PUBLICO_SQL}`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    const p = rows[0];
    const stockMap = await erp.getStockMap().catch(() => null);
    const rel = await pool.query(
      `SELECT * FROM productos WHERE ${PUBLICO_SQL} AND categoria_producto = $1 AND id <> $2
       ORDER BY abs(precio_venta - $3) LIMIT 3`,
      [p.categoria_producto, p.id, p.precio_venta || 0]
    );
    res.json({ ...toPublic(p, stockMap), relacionados: rel.rows.map((r) => toPublic(r, stockMap)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo leer la base de datos' });
  }
});

// ---------- API: crear producto con imagen (admin) ----------
app.post('/api/productos', requireAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, costo, precio_venta, referencia_interna, unidad_medida, categoria_producto, descripcion } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
    }

    let archivo_imagen = null;
    let imagen_url = null;
    if (req.file) {
      archivo_imagen = req.file.filename;
      imagen_url = `/uploads/${req.file.filename}`;
    }

    const { rows } = await pool.query(
      `INSERT INTO productos
        (costo, nombre, precio_venta, referencia_interna, unidad_medida, categoria_producto, archivo_imagen, imagen_url, descripcion, destacado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        costo || null,
        nombre.trim(),
        precio_venta || null,
        referencia_interna || null,
        unidad_medida || null,
        categoria_producto || null,
        archivo_imagen,
        imagen_url,
        descripcion || null,
        req.body.destacado === 'true' || req.body.destacado === 'on',
      ]
    );

    res.status(201).json(toPublic(rows[0], null));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'No se pudo guardar el producto' });
  }
});

// ---------- API: marcar destacado / publicar-ocultar (admin) ----------
app.patch('/api/productos/:id(\\d+)', requireAdmin, async (req, res) => {
  try {
    const sets = [];
    const params = [];
    for (const campo of ['destacado', 'publicado']) {
      if (typeof req.body[campo] === 'boolean') {
        params.push(req.body[campo]);
        sets.push(`${campo} = $${params.length}`);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
    params.push(req.params.id);
    const { rows } = await pool.query(`UPDATE productos SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(toPublic(rows[0], null));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo actualizar el producto' });
  }
});

// ---------- API: solicitud de cotización (pública) → base local + lead en el ERP ----------
function notasLead(s) {
  const lineas = s.items.map(
    (i) => `- ${i.cantidad} x ${i.nombre}${i.referencia ? ` [${i.referencia}]` : ''} @ S/ ${i.precio_unitario.toFixed(2)}`
  );
  return [
    `Solicitud de cotización ${s.codigo} desde la tienda web.`,
    s.tipo_cliente ? `Tipo de cliente: ${s.tipo_cliente}` : null,
    s.ciudad ? `Ciudad del proyecto: ${s.ciudad}` : null,
    s.consumo_kwh ? `Consumo mensual: ${s.consumo_kwh} kWh` : null,
    '',
    'Productos:',
    ...lineas,
    `Total de referencia: S/ ${Number(s.total).toFixed(2)}`,
  ]
    .filter((l) => l !== null)
    .join('\n');
}

async function enviarAlErp(solicitud) {
  try {
    const lead = await erp.crearLead({
      contacto: solicitud.contacto,
      empresa: solicitud.empresa,
      correo: solicitud.correo,
      telefono: solicitud.telefono,
      total: Number(solicitud.total),
      notas: notasLead(solicitud),
    });
    const { rows } = await pool.query(
      `UPDATE solicitudes_cotizacion SET erp_lead=$1, erp_error=NULL, erp_enviado_en=NOW() WHERE id=$2 RETURNING *`,
      [lead.codigo, solicitud.id]
    );
    return rows[0];
  } catch (err) {
    const { rows } = await pool.query(`UPDATE solicitudes_cotizacion SET erp_error=$1 WHERE id=$2 RETURNING *`, [
      err.message,
      solicitud.id,
    ]);
    return rows[0];
  }
}

const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

app.post('/api/cotizaciones', rateLimit(8, 15 * 60 * 1000), async (req, res) => {
  try {
    const b = req.body || {};
    const contacto = str(b.contacto);
    const correo = str(b.correo);
    if (!contacto || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({ error: 'Contacto y un correo válido son obligatorios' });
    }
    const pedidos = Array.isArray(b.items) ? b.items.slice(0, 100) : [];
    const ids = pedidos.map((i) => parseInt(i.id)).filter(Boolean);
    if (!ids.length) return res.status(400).json({ error: 'Agrega al menos un producto a la cotización' });

    // Precios siempre desde la base, nunca los que manda el navegador
    const { rows: prods } = await pool.query(`SELECT * FROM productos WHERE id = ANY($1) AND ${PUBLICO_SQL}`, [ids]);
    const porId = new Map(prods.map((p) => [p.id, p]));
    const items = pedidos
      .map((i) => {
        const p = porId.get(parseInt(i.id));
        const cantidad = Math.min(Math.max(parseInt(i.qty) || 1, 1), 10000);
        return p && {
          id: p.id,
          nombre: p.nombre,
          referencia: p.referencia_interna,
          cantidad,
          precio_unitario: Number(p.precio_venta),
          subtotal: Number(p.precio_venta) * cantidad,
        };
      })
      .filter(Boolean);
    if (!items.length) return res.status(400).json({ error: 'Los productos solicitados ya no están disponibles' });
    const total = items.reduce((t, i) => t + i.subtotal, 0);

    const { rows } = await pool.query(
      `INSERT INTO solicitudes_cotizacion
        (codigo, empresa, contacto, correo, telefono, ciudad, consumo_kwh, tipo_cliente, items, total)
       VALUES ('WEB-' || to_char(nextval('solicitud_numero_seq'), 'FM00000'), $1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [str(b.empresa), contacto, correo, str(b.telefono, 40), str(b.ciudad), str(b.consumo, 40),
        str(b.tipo_cliente, 20), JSON.stringify(items), total]
    );
    let solicitud = rows[0];
    if (erp.configured()) solicitud = await enviarAlErp(solicitud);

    res.status(201).json({ codigo: solicitud.codigo, total, erp_lead: solicitud.erp_lead || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo registrar la solicitud' });
  }
});

// ---------- Admin: solicitudes recibidas y estado de la integración con el ERP ----------
app.get('/api/admin/cotizaciones', requireAdmin, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM solicitudes_cotizacion ORDER BY creado_en DESC LIMIT 100');
  res.json({ solicitudes: rows });
});

app.post('/api/admin/cotizaciones/:id(\\d+)/reenviar', requireAdmin, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM solicitudes_cotizacion WHERE id=$1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Solicitud no encontrada' });
  if (!erp.configured()) return res.status(400).json({ error: 'ERP no configurado (falta ERP_API_TOKEN)' });
  res.json(await enviarAlErp(rows[0]));
});

app.get('/api/admin/erp', requireAdmin, async (req, res) => {
  res.json(await erp.status());
});

// Reintenta cada 10 min las solicitudes que no llegaron al ERP (p. ej. ERP caído)
async function reintentarPendientes() {
  if (!erp.configured()) return;
  const { rows } = await pool.query(
    `SELECT * FROM solicitudes_cotizacion WHERE erp_lead IS NULL AND creado_en > NOW() - INTERVAL '7 days' ORDER BY id LIMIT 20`
  );
  for (const s of rows) await enviarAlErp(s);
}

ensureTables()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API de productos escuchando en el puerto ${PORT}`);
      console.log(erp.configured() ? `ERP conectado en ${erp.ERP_API_URL}` : 'ERP no configurado (ERP_API_TOKEN vacío)');
    });
    setInterval(() => reintentarPendientes().catch((e) => console.error(e)), 10 * 60 * 1000);
  })
  .catch((err) => {
    console.error('No se pudo conectar/crear la tabla en PostgreSQL:', err.message);
    process.exit(1);
  });
