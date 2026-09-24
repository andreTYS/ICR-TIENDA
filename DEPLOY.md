# Despliegue en el VPS

Todo corre con Docker Compose detrás del Traefik compartido del VPS (mismo patrón que ICR Almacén):
red externa `traefik_public`, entrypoints `web`/`websecure` y certresolver `letsencrypt`.
Si en tu Traefik se llaman distinto, ajusta `docker-compose.yml`.

Servicios:

- `db` — PostgreSQL 16. Volumen `db_data`. La primera vez ejecuta `db/init/*.sql` (carga los productos).
- `backend` — API Express en el puerto 4000. Volumen `uploads` (la primera vez se llena con las imágenes del repo).
  Traefik le manda `/api`, `/uploads` y `/admin`.
- `frontend` — Next.js standalone en el puerto 3000. Traefik le manda todo lo demás.

## 1. DNS

Crea un registro `A` del dominio (p. ej. `tienda.inversiones.icr`) apuntando a la IP del VPS.

## 2. Levantar

```bash
git clone https://github.com/andreTYS/ICR-TIENDA.git
cd ICR-TIENDA
cp .env.example .env
nano .env        # DOMAIN, POSTGRES_PASSWORD, ADMIN_PASSWORD
docker compose up -d --build
docker compose logs -f
```

## 3. Actualizar

```bash
git pull
docker compose up -d --build
```

La base y las imágenes subidas viven en volúmenes, no se pierden al reconstruir.
Los `.sql` de `db/init/` **no** se vuelven a ejecutar si el volumen `db_data` ya existe.

## Respaldo

```bash
docker compose exec db pg_dump -U postgres productos_icr > backup_$(date +%F).sql
docker run --rm -v icr-tienda_uploads:/u -v "$PWD":/b alpine tar czf /b/uploads_$(date +%F).tgz -C /u .
```

(El nombre real del volumen lo ves con `docker volume ls`.)

## Pruebas locales (sin Traefik)

```bash
docker compose -f docker-compose.local.yml up --build
```

- Tienda: http://localhost:3000
- Admin/API: http://localhost:4000/admin/ (sin contraseña en local)
