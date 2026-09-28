# ICR-TIENDA

Tienda online de Inversiones ICR (energía solar y respaldo energético): catálogo técnico +
solicitud de cotización que cae como Lead real al ERP (`ICR-LOGISTICA`). No es un checkout con
pago en línea — el flujo es **catálogo → pedido/cotización → un vendedor lo cierra desde el ERP**.

Este repo consolida dos proyectos que antes vivían separados:

- **`/` (raíz)** — el frontend Next.js de la tienda (antes `FrontTiendaICR`).
- **`tools/importador-productos/`** — herramienta de staging para relevar productos con foto
  antes de darlos de alta en el ERP (antes `DemoDB-Productos`). Ver su propio README.

## Stack

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4. Build `output: "standalone"`,
Docker de 3 etapas, mismo patrón de despliegue (Docker Compose + Traefik) que `ICR-LOGISTICA`.

## Estructura de páginas

| Ruta | Contenido |
|---|---|
| `/` | Landing: soluciones, marcas, llamado a catálogo/cotización |
| `/catalogo` | Catálogo técnico con filtros (categoría, marca, aplicación, solución) |
| `/calculadora-solar` | Dimensionador solar: calcula on-grid/híbrido/off-grid con equipos reales del catálogo a partir del recibo de luz |
| `/producto/[id]` | Ficha de producto: specs, precio, "Añadir a cotización" |
| `/cotizacion` | Carrito de referencias + formulario → crea un Lead en el ERP |
| `/soluciones` | Páginas de soluciones (residencial, industrial, off-grid, etc.) |
| `/login`, `/registro`, `/perfil` | Cuenta de cliente |
| `/proyectos` | Seguimiento de proyectos del cliente |

## Integración con el ERP

El catálogo y la cotización pueden funcionar de dos formas:

- **Sin conectar al ERP** (por defecto, sin configurar nada): la tienda muestra un catálogo
  estático de ejemplo (`src/data/products.ts`) y el formulario de cotización responde con un
  error claro en vez de fallar en silencio.
- **Conectada al ERP** (configurando `ERP_API_URL` + `ERP_API_TOKEN`, ver `DEPLOY.md`):
  - `/catalogo` y `/producto/[id]` leen precio (`precio_venta`) y stock en vivo desde
    `GET /inventory/products` y `GET /inventory/stock` del ERP.
  - `/cotizacion` crea un Lead real (`origen: WEB`) vía `POST /crm/leads`, con el detalle de las
    referencias pedidas en las notas del Lead. Un vendedor lo ve y lo trabaja desde el ERP como
    cualquier otro Lead.

Toda la integración vive server-side en `src/lib/erp.ts` y en los Route Handlers de
`src/app/api/*` — el token de servicio del ERP nunca se envía al navegador. Usa el mismo mecanismo
de "token de servicio actuando como un usuario" que ya usa N8N para integrarse con el ERP, así que
no fue necesario agregar endpoints públicos nuevos al ERP.

## Calculadora solar (`/calculadora-solar`)

Puerto a TypeScript del dimensionador interno de ICR (`Dimensionador_Solar_ICR_Pro.xlsx`): mismas
fórmulas para las 3 variantes (ON-GRID, HÍBRIDO, OFF-GRID) — energía a cubrir, Wp requerido,
potencia mínima de inversor, kWh de batería, recorte por perfil horario, ahorro y retorno. Vive en
`src/lib/dimensionadorSolar.ts`, sin dependencias del catálogo.

El catálogo real (los productos importados del ERP, `GET /api/productos`) no tiene columnas
estructuradas de Wp/kW/V/Ah como el Excel — así que `src/lib/matchEquiposSolares.ts` las **parsea
del nombre real del producto** (ej. `"570W PANEL SOLAR TRINA..."`, `"3KW INVERSOR RED GROWATT"`,
`"12V 100AH BATERIA LITIO"`) y elige, por categoría, el equipo real más chico que cumple el
mínimo calculado — mismo criterio que el Excel. Un nombre que no se puede interpretar
simplemente no entra como candidato (nunca rompe la página); si no hay ningún candidato en una
categoría, esa línea se muestra como "a definir por nuestro equipo técnico".

Simplificaciones deliberadas frente al Excel (es una herramienta de generación de leads para el
público, no el presupuesto interno — ese lo sigue armando un ingeniero): un solo método de
consumo (recibo de luz, no el formulario de equipos por horas), cobertura diurna fija en 100%,
DoD de batería fijo en litio (0.9), y estructura/cableado/instalación estimados como un
porcentaje sobre el equipo principal en vez de emparejarse ítem por ítem.

"Solicitar esta cotización" agrega los equipos sugeridos al mismo carrito de `/cotizacion`
(`useQuote().add`) y guarda un resumen en `sessionStorage` que `/cotizacion` adjunta a las notas
del Lead — mismo Lead real de siempre, con el contexto del cálculo ya adentro.

## Desarrollo local

```bash
npm install
npm run dev
```

Para probar con el catálogo/cotización conectados al ERP, copia `.env.example` a `.env.local` y
completa `ERP_API_URL`/`ERP_API_TOKEN` (ver sección anterior).

## Despliegue

Ver [`DEPLOY.md`](./DEPLOY.md) — build de producción, Docker Compose local, despliegue en el VPS
detrás de Traefik, y cómo conectar la tienda al ERP real.
