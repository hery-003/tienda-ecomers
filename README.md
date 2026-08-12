# MiTienda | Streetwear Premium

Tienda de e-commerce (Next.js 16 + App Router) con catálogo de productos, carrito, checkout por WhatsApp y panel de administración.

## Requisitos

- Node.js 20+
- npm

## Instalación

```bash
npm install
```

## Configuración

Crea el archivo `.env.local` en la raíz:

```env
# Secreto para firmar sesiones del admin (genera uno aleatorio)
AUTH_SECRET=genera-un-secreto-aleatorio
# URL pública de tu sitio (para sitemap y metadata)
NEXT_PUBLIC_SITE_URL=https://tudominio.com
# (Opcional) Contraseña inicial del admin en el primer arranque. Si no se define, usa "admin123".
ADMIN_PASSWORD=contraseña-fuerte
```

Para generar un secreto aleatorio:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Desarrollo

```bash
npm run dev
```

- Tienda: http://localhost:3000
- Admin: http://localhost:3000/admin (contraseña inicial: `admin123` — cámbiala al entrar en *Configuración → Cambiar contraseña*)

## Producción (VPS)

**Importante:** los datos (productos, pedidos, configuración, administrador) se guardan en una base **SQLite** (`data/store.db`) vía Prisma. Esto **no funciona en Vercel serverless** (el sistema de archivos no persiste). Necesitas un servidor propio (VPS) o contenedor con disco persistente.

```bash
# 1. Compilar
npm run build

# 2. Ejecutar
npm start
```

Con PM2 (mantener vivo y auto-reiniciar):

```bash
npm install -g pm2
pm2 start "npm run start" --name mitienda
pm2 save
pm2 startup
```

Usa un proxy inverso (Nginx/Caddy) hacia el puerto 3000 con HTTPS. En `next.config.ts` usa `output: "standalone"` si prefieres el artefacto autocontenido.

**Seguridad:**
- El rate-limit del login (5 intentos en 15 min) se basa en las cabeceras `x-real-ip` / `x-forwarded-for`. Debe estar detrás de un proxy inverso que **sobrescriba** esas cabeceras; si el puerto 3000 queda expuesto directo, cualquiera puede falsearlas.
- Se envían cabeceras de seguridad (CSP, `X-Frame-Options`, etc.) desde `next.config.ts`. Activa HSTS y HTTPS en el proxy (p. ej. `Strict-Transport-Security: max-age=63072000`).
- Los cupones se exponen públicamente (`GET /api/coupons`) porque la tienda los valida en el navegador; cualquier visitante puede aplicar un cupón válido. Quien crea cupones debe asumir que son públicos.
- Backups periódicos de `data/store.db`.

## Despliegue con Docker (opcional)

```bash
# Construir imagen
docker build -t mitienda .
# Ejecutar con volumen persistente para data/
docker run -d -p 3000:3000 -e AUTH_SECRET=secreto \
  -v mitienda-data:/app/data mitienda
```

## Estructura

- `app/` — páginas (`/` tienda, `/admin` panel) y API routes (`app/api/`)
- `components/` — componentes client (tienda, admin)
- `lib/` — capa de datos (`store.ts`, `auth.ts`, `productImage.ts`, `db.ts`)
- `data/` — base de datos SQLite (`store.db`) y JSON legacy de importación (gitignoreado)
- `prisma/` — esquema de datos (`schema.prisma`)
- `scripts/` — `seed.mjs` para inicializar la BD
- `legacy-backup/` — versión estática original de referencia

## API

| Ruta | Métodos | Descripción |
| --- | --- | --- |
| `/api/products` | GET, POST | Listar / crear productos |
| `/api/products/[id]` | PUT, DELETE | Editar / eliminar producto |
| `/api/config` | GET, PUT | Configuración de la tienda |
| `/api/coupons` | GET, POST | Cupones |
| `/api/coupons/[code]` | DELETE | Eliminar cupón |
| `/api/orders` | GET, POST | Pedidos |
| `/api/login` | POST | Iniciar sesión (cookie httpOnly) |
| `/api/logout` | POST | Cerrar sesión |
| `/api/admin/password` | POST | Cambiar contraseña del admin |
