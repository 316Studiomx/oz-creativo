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
