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

**Importante:** los datos (productos, pedidos, configuración) se guardan en archivos JSON dentro de `data/`. Esto **no funciona en Vercel serverless** (el sistema de archivos no persiste). Necesitas un servidor propio (VPS) o contenedor con disco persistente.

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
- `lib/` — capa de datos (`store.ts`, `auth.ts`, `productImage.ts`)
- `data/` — archivos JSON persistentes (gitignoreado)
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
