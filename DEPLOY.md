# Despliegue en el VPS — tienda.inversionesicr.com

La tienda corre con Docker Compose en el mismo VPS que la web (`inversionesicr.com`) y el ERP
(`erp.inversionesicr.com`), detrás del **mismo Traefik compartido**: contenedor `n8n-traefik-1`,
red `n8n_default`, certresolver `mytlschallenge`. El SSL no se configura aparte: Traefik pide el
certificado de Let's Encrypt solo, en el primer request HTTPS, siempre que el DNS ya apunte al VPS.

| Servicio | Qué es | Rutas |
|---|---|---|
| `frontend` | Tienda Next.js | todo lo demás |
| `backend` | API Express + panel admin | `/api`, `/uploads`, `/admin` |
| `db` | PostgreSQL 16 (productos y solicitudes) | solo red interna |

## 1. DNS

En el panel del dominio `inversionesicr.com` crea un registro:

| Tipo | Nombre | Valor |
|---|---|---|
| A | `tienda` | la IP del VPS (la misma a la que apunta `erp`) |

Comprobar: `getent hosts tienda.inversionesicr.com` debe devolver la IP del VPS.

## 2. Token del ERP (para stock, CRM y ventas)

En `https://erp.inversionesicr.com` como ADMIN:

1. *Administración → Usuarios*: crea un usuario **“Tienda web”** con rol **VENTAS**
   (tiene justo los permisos que usa la tienda: `inventory.stock.get`, `crm.manage`, `store.query`).
2. *Administración → Tokens de servicio*: crea un token que actúe como ese usuario.
   Copia el valor (empieza con `icr_`, se muestra una sola vez) en `ERP_API_TOKEN` del `.env`.

Qué hace la tienda con el ERP:

- **Stock**: cada producto muestra el stock disponible del ERP (suma de almacenes), cruzando
  `referencia_interna` de la tienda con el `sku` del ERP (o por nombre). Caché de 2 minutos.
- **Solicitudes de cotización**: se guardan en la base de la tienda (`WEB-00001`…) y se crean como
  **lead en CRM** del ERP (origen WEB, monto estimado y detalle de productos en notas). Si el ERP no
  responde, se reintenta sola cada 10 min o con “Reenviar” en `/admin`.
- **Más vendidos** de la portada: según las ventas de *Tienda* registradas en el ERP (12 meses).

Sin token la tienda funciona igual (stock “Consultar disponibilidad”, solicitudes quedan en `/admin`).

> Opcional: como la tienda y el ERP están en la misma red `n8n_default`, se puede usar
> `ERP_API_URL=http://icr_almacen_backend:4000/api` para no salir a internet.

## 3. Levantar

```bash
cd /opt
git clone https://github.com/andreTYS/ICR-TIENDA.git icr-tienda
cd icr-tienda
cp .env.example .env
nano .env          # POSTGRES_PASSWORD, ADMIN_PASSWORD, ERP_API_TOKEN
./deploy.sh
```

`deploy.sh` verifica la red y el certresolver de Traefik, el DNS, levanta los contenedores y al final
prueba `https://tienda.inversionesicr.com` (certificado) y la conexión con el ERP.

## 4. Actualizar

```bash
cd /opt/icr-tienda && git pull && ./deploy.sh
```

La base, las imágenes subidas y las solicitudes viven en volúmenes: no se pierden al reconstruir.
Los `.sql` de `db/init/` solo se ejecutan la primera vez (volumen `db_data` vacío).

## Si el SSL no sale

```bash
docker logs n8n-traefik-1 2>&1 | grep -i -E "acme|tienda" | tail -20
docker inspect n8n-traefik-1 --format '{{json .Config.Cmd}}' | tr ',' '\n' | grep -i resolvers
```

- `NXDOMAIN` / `no valid A records`: falta el registro DNS del paso 1.
- Otro nombre de resolver: ponlo en `TRAEFIK_CERTRESOLVER` del `.env` y corre `./deploy.sh`.
- Let's Encrypt limita 5 intentos fallidos por hora: corrige y espera antes de reintentar.

## Respaldo

```bash
docker compose exec db pg_dump -U postgres productos_icr > backup_$(date +%F).sql
docker run --rm -v icr-tienda_uploads:/u -v "$PWD":/b alpine tar czf /b/uploads_$(date +%F).tgz -C /u .
```

## Pruebas locales (sin Traefik)

```bash
docker compose -f docker-compose.local.yml up --build
```

Tienda en http://localhost:3000 · Admin/API en http://localhost:4000/admin/ (sin contraseña en local).
