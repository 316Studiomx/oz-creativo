# Oz Creativo — Sitio personal

Experiencia 3D interactiva, motion-first y scroll-driven. Negro sobre amarillo,
tipografía editorial gigante (Clash Display) y una sola estrella de color.

## Stack

- **Vite + React + TypeScript**
- **React Three Fiber + drei** — escena 3D (retrato, asterisco ✳, neón, partículas)
- **GSAP + ScrollTrigger + Lenis** — scroll suave y animaciones encadenadas
- **Framer Motion** — microinteracciones de UI
- **Tailwind CSS** — layout y tokens

## Cómo correr

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de producción en /dist
npm run preview  # previsualiza el build
```

## Deploy

Listo para **Vercel** (`vercel.json`) o **Netlify** (`netlify.toml`).
Build command `npm run build`, carpeta de salida `dist`.

## Hazlo Magnifico Store

La tienda real del libro vive en `/libro` y usa rutas aisladas bajo `/api/book/*`.
El flujo existente de cotizaciones/pagos privados se mantiene separado.

### Flujo operativo

1. El cliente llena el formulario nacional en `/libro`.
2. Se crea una orden local y una sesion de Stripe Checkout.
3. Stripe confirma el pago en `/api/book/webhooks/stripe`.
4. El webhook marca el pedido como pagado, descuenta inventario, registra cupones y manda correos de compra.
5. La guia no se crea automaticamente: desde `/admin`, se cotiza y se genera la guia de Skydropx.
6. Cuando Skydropx devuelve guia y etiqueta, se guarda el tracking y se manda el correo de rastreo una sola vez.

### Base de datos

Este proyecto usa Netlify Database con Drizzle y `pg`.

- `@netlify/database` obtiene la conexion con `getConnectionString()` en `db/index.ts`.
- Las migraciones viven en `netlify/database/migrations/<timestamp_slug>/migration.sql`.
- La migracion actual de la tienda esta en `netlify/database/migrations/20260706000000_create_hazlo_magnifico_store/migration.sql`.
- No se debe crear ni commitear `DATABASE_URL`; Netlify provee la conexion en su entorno.
- Despues de tener la base disponible, corre `npm run db:seed` para crear el producto, inventario inicial y reglas de descuento.

### Variables de entorno

Configura estas variables en Netlify para produccion. Las credenciales reales no van en git.

```bash
SITE_URL=https://ozcreativo.com

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET_BOOK=

RESEND_API_KEY=
ORDER_FROM_EMAIL=Oz Creativo <pedidos@ozcreativo.com>
SUPPORT_EMAIL=oz@expocuspide.com
ADMIN_EMAIL=oz@expocuspide.com
ADMIN_PASSWORD_HASH=
SESSION_SECRET=

SKYDROPX_CLIENT_ID=
SKYDROPX_CLIENT_SECRET=
SKYDROPX_BASE_URL=https://api-pro.skydropx.com
SKYDROPX_ORIGIN_NAME=
SKYDROPX_ORIGIN_COMPANY=Oz Creativo
SKYDROPX_ORIGIN_PHONE=
SKYDROPX_ORIGIN_EMAIL=oz@expocuspide.com
SKYDROPX_ORIGIN_STREET=
SKYDROPX_ORIGIN_EXTERIOR_NUMBER=
SKYDROPX_ORIGIN_INTERIOR_NUMBER=
SKYDROPX_ORIGIN_NEIGHBORHOOD=
SKYDROPX_ORIGIN_CITY=
SKYDROPX_ORIGIN_STATE=
SKYDROPX_ORIGIN_POSTAL_CODE=
SKYDROPX_ORIGIN_COUNTRY=MX
SKYDROPX_ORIGIN_REFERENCE=
SKYDROPX_CONSIGNMENT_NOTE=Hazlo Magnifico
SKYDROPX_PACKAGE_TYPE=
```

Netlify CLI permite configurar variables con `netlify env:set`. Marca como secretas las llaves privadas:

```bash
netlify env:set STRIPE_SECRET_KEY "..." --context production --secret
netlify env:set RESEND_API_KEY "..." --context production --secret
netlify env:set SKYDROPX_CLIENT_SECRET "..." --context production --secret
```

### Admin

El panel vive en `/admin`. Genera el hash de la contrasena con bcryptjs y coloca el resultado en `ADMIN_PASSWORD_HASH`:

```bash
node -e "import('bcryptjs').then(async ({ default: bcrypt }) => console.log(await bcrypt.hash('CAMBIA_ESTA_PASSWORD', 12)))"
```

Usa un `SESSION_SECRET` largo y unico. El panel permite ver pedidos, inventario, cupones, solicitudes internacionales, historial de emails y guias.

### Stripe

Crea un webhook en Stripe apuntando a:

```text
https://ozcreativo.com/api/book/webhooks/stripe
```

Evento requerido:

```text
checkout.session.completed
```

Copia el signing secret del webhook en `STRIPE_WEBHOOK_SECRET_BOOK`.

### Skydropx

Skydropx se ejecuta solamente desde admin despues de pago confirmado.

- Cotizacion: admin solicita tarifas desde el detalle de pedido.
- Guia: admin elige tarifa y confirma creacion.
- Seguridad: si Skydropx responde sin tracking o sin etiqueta, el pedido queda en `label_error` para reintento.
- Tracking: el correo de rastreo usa una llave idempotente por pedido y numero de guia.

### Comandos de verificacion

```bash
npm test
npm run lint
npm run build
git diff --check
```

### QA antes de produccion

- `/libro` renderiza correctamente en desktop y movil.
- Checkout abre Stripe y regresa a `/gracias`.
- El webhook de Stripe marca el pedido como pagado y descuenta inventario.
- El pedido aparece en `/admin`.
- Desde `/admin`, se cotiza envio, se crea guia y se envia el correo de rastreo una sola vez.
- `/pedido/:orderNumber?token=...` muestra tracking cuando existe.
- Las paginas legales `/politica-de-envios`, `/cambios-devoluciones`, `/aviso-de-privacidad`, `/terminos-y-condiciones` y `/contacto-soporte` renderizan.
- Las rutas existentes de propuestas y pagos privados siguen funcionando.

## Cómo editar (lo que vas a tocar seguido)

Todo está centralizado para que no tengas que entrar al código de los componentes:

| Quiero cambiar… | Archivo |
|---|---|
| **Textos** (titulares, párrafos, CTAs, links, testimonios, redes) | `src/config/copy.ts` |
| **Colores** (amarillo, negro, grises) | `src/config/tokens.ts` (+ `tailwind.config.js`) |
| **Ajuste de movimiento** (suavizado, parallax) | `src/config/tokens.ts` → `MOTION` |
| **Meta tags / SEO / Open Graph** | `index.html` |

### Cambiar el amarillo
Edita `COLORS.yellow` en `src/config/tokens.ts` **y** `colors.yellow.DEFAULT`
en `tailwind.config.js` (Tailwind lee su propio config en build).

### Poner tu foto real en el hero
Ahora el retrato es un **placeholder estilizado** generado por código
(`src/three/HeroPortrait.tsx`). Para usar tu foto real (idealmente PNG con fondo
recortado):

1. Guarda la imagen en `public/assets/retrato.png`.
2. En `src/three/Scene.tsx`, pásala al componente:
   ```tsx
   <HeroPortrait pointer={pointer} reduced={reduced} imageUrl="/assets/retrato.png" />
   ```
El componente ya soporta `imageUrl` y reemplaza el placeholder automáticamente,
manteniendo el parallax y el "shine" amarillo.

### Imagen para compartir en redes (Open Graph)
Coloca `public/assets/og-image.jpg` (1200×630 recomendado). Ya está referenciada
en `index.html`.

## Estructura

```
src/
├─ config/      tokens.ts (colores) · copy.ts (todo el texto)
├─ three/       Scene + Asterisk, NeonStrip, HeroPortrait, Particles, CursorLight
├─ sections/    Hero, Stats, About, Services, Track, Contact
├─ components/  Nav, Cursor, Magnetic, Counter, PullQuote, ServiceCard, Grain…
└─ hooks/       useReducedMotion, usePointer, useIsMobile
```

## Accesibilidad y performance

- **`prefers-reduced-motion`**: versión calmada, sin parallax brusco ni loops.
- **Móvil / gama baja**: el WebGL pesado se reemplaza por un fallback CSS ligero
  (`HeroBackdropFallback`) — se detecta por ancho de pantalla, puntero táctil y
  núcleos de CPU (`useIsMobile`).
- El canvas 3D va **lazy + Suspense**: el primer pintado nunca espera a three.js.
- Three.js queda en su propio chunk (`manualChunks`) para no bloquear la carga.
- Contraste AA, navegación por teclado y `alt` en imágenes.
