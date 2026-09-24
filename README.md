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
| `https://DOMAIN/admin/` | Panel para agregar productos (usuario/clave de `.env`) |

Despliegue: ver [DEPLOY.md](DEPLOY.md).
