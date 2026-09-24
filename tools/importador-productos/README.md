# Demo local — Productos ICR

> **Nota (consolidación):** esta carpeta viene del repo original `DemoDB-Productos`.
> Trae los **800 productos reales** (con foto) que ya se relevaron para la tienda, en
> `productos_icr_local.csv` / `productos_icr_dump.sql` + `uploads/`. Es una herramienta
> de importación/staging local — su tabla `productos` es propia de este demo, **no** la
> tabla `productos` del ERP (`ICR-LOGISTICA`), que tiene columnas distintas (SKU,
> tipo_control, `precio_venta`, etc.). Antes de usar este catálogo en producción, alguien
> tiene que mapear estas 800 filas a esa tabla real (vía `POST /inventory/products/import-csv`
> del ERP) — todavía no está hecho automáticamente.

App mínima para agregar productos arrastrando una imagen, que se guarda
localmente en `/uploads` y en tu base de datos PostgreSQL.

## 1. Requisitos
- Node.js instalado (v18 o más reciente)
- PostgreSQL ya corriendo (local o el que ya tengas con los 800 productos importados)

## 2. Instalación

```bash
cd DemoDB-Productos
npm install
```

## 3. Configurar la conexión a Postgres

Copia `.env.example` a `.env` y coloca tus datos reales:

```bash
cp .env.example .env
```

Edita `.env`:
```
PGHOST=localhost
PGPORT=5432
PGDATABASE=tu_base
PGUSER=tu_usuario
PGPASSWORD=tu_password
PORT=3000
```

## 4. Levantar el demo

```bash
npm start
```

Abre **http://localhost:3000** en tu navegador.

## 5. Cómo funciona

- Al crear la tabla `productos` (si no existe ya, con las columnas que
  usamos en la importación masiva: nombre, costo, precio_venta,
  referencia_interna, unidad_medida, categoria_producto, archivo_imagen,
  imagen_url).
- Cuando arrastras una imagen y guardas el formulario:
  1. La imagen se guarda como archivo real en la carpeta `uploads/` de este proyecto.
  2. Se inserta una fila nueva en la tabla `productos` de tu PostgreSQL,
     con `imagen_url` apuntando a `http://localhost:3000/uploads/archivo.jpg`
     (el enlace local que la sirve).
  3. El catálogo de la derecha se actualiza solo, leyendo directo de la base de datos.

## 6. Cargar tus 800 productos existentes (todo local, sin dominio)

Esta carpeta ya trae dos cosas listas para esto:

- `uploads/` — ya tiene las 800 imágenes copiadas adentro.
- `productos_icr_local.csv` — el CSV de tus productos, con la columna
  `imagen_url` apuntando a `http://localhost:3000/uploads/archivo.jpg`
  (el mismo puerto que usa este servidor).

Pasos:

1. Asegúrate de haber corrido el script `crear_base_completa.sql` (o al
   menos el `CREATE TABLE productos...`) en pgAdmin, sobre la base que
   pusiste en tu `.env`.
2. En pgAdmin, clic derecho sobre la tabla `productos` → **Import/Export
   Data...** → activa **Import** → selecciona `productos_icr_local.csv`
   → Format `csv`, Encoding `UTF8`, marca `Header` → OK.
3. Corre `npm start` (si no lo tienes corriendo ya).
4. Abre `http://localhost:3000` — ahí verás los 800 productos con sus
   fotos, servidas directo desde tu propia computadora (carpeta
   `uploads/`), sin necesidad de ningún dominio ni servidor externo.

Nota: como las imágenes se sirven en `http://localhost:3000/uploads/...`,
solo funcionan mientras el servidor (`npm start`) esté corriendo en esa
misma computadora. Es un demo local — para producción real (que otras
personas vean las fotos desde internet), ahí sí necesitarías un dominio
o VPS público (la Opción B que hablamos antes, pero apuntando afuera en
vez de a `localhost`).

## 7. Agregar productos nuevos después

Una vez cargados los 800, puedes seguir agregando productos uno por uno
desde el formulario de la izquierda (arrastrando la imagen) — ambos
caminos (la carga masiva y el formulario) escriben a la misma tabla
`productos` y sirven sus imágenes desde la misma carpeta `uploads/`.
