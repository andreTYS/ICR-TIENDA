require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Conexión a PostgreSQL ----------
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

// Crea la tabla si no existe (misma estructura que usamos en el import masivo)
async function ensureTable() {
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
  `);
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

// ---------- Protección del panel de administración ----------
// Basic Auth para /admin y para crear productos. Si ADMIN_PASSWORD no está
// definido (solo en local) el panel queda abierto.
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

// Las URLs guardadas pueden venir del import local (http://localhost:3000/uploads/...).
// Siempre se devuelven relativas para que funcionen detrás de cualquier dominio.
function withImageUrl(p) {
  return { ...p, imagen_url: p.archivo_imagen ? `/uploads/${p.archivo_imagen}` : p.imagen_url };
}

app.set('trust proxy', true);
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));
app.get('/admin', (req, res, next) => (req.path === '/admin' ? res.redirect(301, '/admin/') : next()));
app.use('/admin', requireAdmin, express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.redirect('/admin/'));

// ---------- API: listar productos (con paginación) ----------
app.get('/api/productos', async (req, res) => {
  try {
    const pageSize = Math.min(parseInt(req.query.pageSize) || 60, 200);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * pageSize;

    const search = (req.query.q || '').trim();
    const params = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE nombre ILIKE $${params.length} OR referencia_interna ILIKE $${params.length} OR categoria_producto ILIKE $${params.length}`;
    }

    const totalResult = await pool.query(
      `SELECT count(*)::int AS total FROM productos ${where}`,
      params
    );
    const total = totalResult.rows[0].total;

    params.push(pageSize, offset);
    const { rows } = await pool.query(
      `SELECT * FROM productos ${where} ORDER BY creado_en DESC, id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      productos: rows.map(withImageUrl),
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

// ---------- API: crear producto con imagen ----------
app.post('/api/productos', requireAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const {
      nombre,
      costo,
      precio_venta,
      referencia_interna,
      unidad_medida,
      categoria_producto,
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
    }

    let archivo_imagen = null;
    let imagen_url = null;
    if (req.file) {
      archivo_imagen = req.file.filename;
      // Ruta relativa: la sirve este mismo servidor bajo el dominio público
      imagen_url = `/uploads/${req.file.filename}`;
    }

    const { rows } = await pool.query(
      `INSERT INTO productos
        (costo, nombre, precio_venta, referencia_interna, unidad_medida, categoria_producto, archivo_imagen, imagen_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
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
      ]
    );

    res.status(201).json(withImageUrl(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'No se pudo guardar el producto' });
  }
});

ensureTable()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API de productos escuchando en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('No se pudo conectar/crear la tabla en PostgreSQL:', err.message);
    process.exit(1);
  });
