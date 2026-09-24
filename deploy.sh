#!/usr/bin/env bash
# Despliega/actualiza la tienda en el VPS y verifica DNS, SSL y conexión con el ERP.
# Uso (en el VPS, dentro de la carpeta del repo):  ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

ok()   { printf '\033[32m✔ %s\033[0m\n' "$*"; }
warn() { printf '\033[33m⚠ %s\033[0m\n' "$*"; }
fail() { printf '\033[31m✘ %s\033[0m\n' "$*"; exit 1; }

[ -f .env ] || fail "Falta .env: cp .env.example .env && nano .env"
set -a; . ./.env; set +a
: "${DOMAIN:?DOMAIN vacío en .env}"
NET="${TRAEFIK_NETWORK:-n8n_default}"
RESOLVER="${TRAEFIK_CERTRESOLVER:-mytlschallenge}"

grep -q '^POSTGRES_PASSWORD=cambia_esta_clave$' .env && fail "Cambia POSTGRES_PASSWORD en .env"
grep -q '^ADMIN_PASSWORD=cambia_esta_clave_tambien$' .env && fail "Cambia ADMIN_PASSWORD en .env"

# 1. Traefik compartido
docker network inspect "$NET" >/dev/null 2>&1 || fail "No existe la red $NET (¿cómo se llama la red de Traefik? docker network ls)"
TRAEFIK=$(docker ps --format '{{.Names}}' | grep -i traefik | head -1 || true)
[ -n "$TRAEFIK" ] || fail "No hay ningún contenedor de Traefik corriendo"
ok "Traefik: $TRAEFIK en la red $NET"
if docker inspect "$TRAEFIK" --format '{{json .Config.Cmd}} {{json .Args}}' | grep -q "certificatesresolvers.$RESOLVER"; then
  ok "certresolver '$RESOLVER' existe en Traefik"
else
  warn "No encontré el certresolver '$RESOLVER' en los argumentos de $TRAEFIK. Resolvers configurados:"
  docker inspect "$TRAEFIK" --format '{{json .Config.Cmd}}' | tr ',' '\n' | grep -o 'certificatesresolvers\.[^.]*' | sort -u || true
  warn "Si es otro nombre, ponlo en TRAEFIK_CERTRESOLVER del .env y vuelve a correr ./deploy.sh"
fi

# 2. DNS: el dominio debe apuntar a este VPS (si no, Let's Encrypt no emite el certificado)
IP_VPS=$(curl -fsS -4 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')
IP_DNS=$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1; exit}' || true)
if [ -z "$IP_DNS" ]; then
  warn "$DOMAIN aún no resuelve. Crea el registro DNS:  A  tienda  ->  $IP_VPS  (y espera unos minutos)"
elif [ "$IP_DNS" != "$IP_VPS" ]; then
  warn "$DOMAIN apunta a $IP_DNS pero este VPS es $IP_VPS"
else
  ok "DNS: $DOMAIN -> $IP_DNS"
fi

# 3. Build y arranque
docker compose up -d --build
ok "Contenedores levantados"
docker compose ps

# 4. Verificación
echo "Esperando que el backend responda..."
for i in $(seq 1 30); do
  docker compose exec -T backend wget -qO- http://localhost:4000/api/health >/dev/null 2>&1 && break
  sleep 2
done
docker compose exec -T backend wget -qO- http://localhost:4000/api/health >/dev/null 2>&1 && ok "Backend OK" || fail "El backend no responde: docker compose logs backend"

echo "Probando HTTPS (el primer certificado puede tardar ~30 s)..."
for i in $(seq 1 12); do
  if curl -fsS -o /dev/null "https://$DOMAIN/api/health" 2>/dev/null; then break; fi
  sleep 5
done
if curl -fsS -o /dev/null "https://$DOMAIN/api/health" 2>/dev/null; then
  ISSUER=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -issuer 2>/dev/null || true)
  ok "HTTPS OK en https://$DOMAIN  ($ISSUER)"
else
  warn "HTTPS todavía no responde con certificado válido. Revisa: docker logs $TRAEFIK 2>&1 | grep -i -E 'acme|$DOMAIN' | tail -20"
fi

# 5. ERP
if [ -n "${ERP_API_TOKEN:-}" ]; then
  docker compose exec -T backend node -e "require('./erp').status().then(s=>{console.log(JSON.stringify(s,null,2));process.exit(s.conectado?0:1)})" \
    && ok "ERP conectado" || warn "El ERP no respondió: revisa ERP_API_URL / ERP_API_TOKEN"
else
  warn "ERP_API_TOKEN vacío: la tienda funciona, pero sin stock del ERP ni leads automáticos"
fi

echo
ok "Tienda:  https://$DOMAIN"
ok "Admin:   https://$DOMAIN/admin/  (usuario: ${ADMIN_USER:-admin})"
