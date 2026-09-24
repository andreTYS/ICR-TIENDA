# Despliegue

La tienda es una app Next.js (App Router) compilada con `output: "standalone"` y empaquetada en una
imagen Docker de tres etapas (`Dockerfile`): instala dependencias, construye, y copia solo el
servidor standalone + assets estáticos a una imagen final `node:22-alpine` corriendo como usuario
no root.

## Pruebas locales (sin Traefik)

```bash
cp .env.example .env   # opcional en local
docker compose -f docker-compose.local.yml up --build
```

Abre http://localhost:3000

## Producción (VPS con Traefik compartido)

`docker-compose.yml` sigue el mismo patrón de infraestructura que el módulo ICR Almacén: Docker
Compose + Traefik como reverse proxy con TLS automático (Let's Encrypt), enrutando por subdominio
con `Host()`.

Asume que en el VPS ya existe una red externa de Docker donde corre el Traefik compartido, y que
ese Traefik tiene configurado un `certresolver` llamado `letsencrypt` y los entrypoints `web`
(puerto 80) y `websecure` (puerto 443). Si el nombre de la red externa o del certresolver en tu
Traefik real es distinto, ajusta `docker-compose.yml` (`networks.traefik_public.name` y las labels
`traefik.*`) antes de desplegar.

```bash
cp .env.example .env
# editar .env y poner el dominio real, p. ej. DOMAIN=tienda.icrinversiones.pe

docker compose up -d --build
```

## Variables de entorno

| Variable | Uso |
|---|---|
| `DOMAIN` | Dominio público que Traefik enruta hacia el contenedor (solo se usa en `docker-compose.yml`, no dentro de la app) |
| `ERP_API_URL` | Base URL de la API del ERP (ICR-LOGISTICA). Ya viene con el valor real por defecto en `docker-compose.yml`/`docker-compose.local.yml` (`https://erp.inversionesicr.com/api`); solo hace falta sobreescribirla si el ERP se muda de dominio. |
| `ERP_API_TOKEN` | Token de servicio emitido desde el ERP (Administración → Tokens de servicio), "actuando como" un usuario con rol VENTAS. Server-side únicamente, nunca llega al navegador. **Obligatorio** para que la tienda quede conectada — sin él, aunque `ERP_API_URL` ya apunte al ERP real, la tienda sigue cayendo al catálogo estático de ejemplo. |

## Conectar la tienda al ERP real

`ERP_API_URL` ya apunta a `https://erp.inversionesicr.com/api` por defecto — lo único que falta es el token:

1. En el ERP (`erp.inversionesicr.com`), entrar como Admin → **Administración → Tokens de servicio**.
2. Crear o reutilizar un usuario con rol **VENTAS**, y emitir un token "actuando como" ese usuario.
3. En el `.env` de la tienda (en el VPS), completar `ERP_API_TOKEN` con ese token.
4. Reiniciar el contenedor (`docker compose up -d --build`).

Con eso, `/catalogo` y las fichas de producto pasan a mostrar precio (`precio_venta`) y stock reales del
ERP, y el formulario de `/cotizacion` crea un Lead real (`origen: WEB`) en el CRM del ERP en vez de
solo mostrar una pantalla de éxito simulada. Si el ERP no está configurado o no responde, la tienda
cae automáticamente al catálogo estático de `src/data/products.ts` sin romperse.
