# ICR-TIENDA

Tienda web + base de datos de productos de Inversiones ICR, en un solo repo para desplegar juntos en el VPS.

| Carpeta | Qué es | Origen |
|---|---|---|
| `frontend/` | Tienda en Next.js (App Router, Tailwind) | [FrontTiendaICR](https://github.com/AdrianAlessandroCalderonBegazo/FrontTiendaICR) |
| `backend/` | API Express + panel `/admin` para cargar productos con imagen, `uploads/` con las ~800 fotos | [DemoDB-Productos](https://github.com/AdrianAlessandroCalderonBegazo/DemoDB-Productos) |
| `db/init/` | Dump PostgreSQL con los productos (se carga solo al crear la base) | DemoDB-Productos |

## Rutas en el dominio

| URL | Servicio |
|---|---|
| `https://DOMAIN/` | Tienda (frontend) |
| `https://DOMAIN/api/productos?q=&page=&pageSize=` | API de productos |
| `https://DOMAIN/uploads/<archivo>` | Imágenes de productos |
| `https://DOMAIN/admin/` | Panel: alta de productos, destacados, solicitudes de cotización y estado del ERP |

Dominio de producción: **https://tienda.inversionesicr.com**

## Integración con el ERP (erp.inversionesicr.com)

- Stock real de cada producto (desde el inventario del ERP).
- Cada solicitud de cotización de la tienda se crea como **lead en el CRM** del ERP.
- "Más vendidos" de la portada según las ventas de *Tienda* registradas en el ERP.

Se configura con un token de servicio del ERP (`ERP_API_TOKEN`), ver [DEPLOY.md](DEPLOY.md).

Despliegue: ver [DEPLOY.md](DEPLOY.md).
