# Portfolio-CV de Arnau Ribalta Marot

Web personal que hace de CV: arnauribaltamarot.com. Astro estático, trilingüe (ES por defecto, CA en /ca/, EN en /en/), desplegado en Vercel desde `main`.

## Reglas
- El contenido vive en `src/data/*.json`. Para cambiar textos, edita los JSON; no escribas contenido dentro de los componentes.
- Todo texto visible tiene `es`, `ca` y `en`. No añadas uno sin los otros (el build falla si falta alguno).
- No inventes datos. Si falta algo, pregunta a Arnau.
- Nunca publiques precios de proyectos, cifras internas de clientes o empresas, datos de Taurus, credenciales ni enlaces a repos privados.
- `visible: false` oculta un elemento en toda la web. Un proyecto tiene tarjeta y página solo si `visible` y `mostrarDetalle` son `true`.
- Imágenes en `src/assets/` (rutas relativas a esa carpeta en los JSON). Si falta una imagen, la web usa un placeholder: el build nunca debe fallar por eso.
- Diseño: tokens en `src/styles/global.css` (estética de adriansaenz.com: oscuro, Playfair Display + Montserrat, títulos en dos tonos, tiles que se invierten al pasar el ratón). No añadas colores ni fuentes nuevas.
- Antes de cada commit: `npm run build` sin errores (incluye `astro check`). Commits en español con Conventional Commits.
- Servidor local: `npm run dev` → http://localhost:3001

## Rutas
| ES | CA | EN |
|---|---|---|
| `/` | `/ca/` | `/en/` |
| `/proyectos/<slug>/` | `/ca/projectes/<slug>/` | `/en/projects/<slug>/` |
| `/privacidad/` | `/ca/privacitat/` | `/en/privacy/` |

Las equivalencias están en `src/lib/i18n.ts`. Los textos legales están en las propias páginas de privacidad.

## Añadir un proyecto
1. Añade un objeto a `src/data/projects.json` con la misma forma que los demás (slug en kebab-case, `orden`, textos en es/ca/en).
2. Pon sus imágenes en `src/assets/img/proyectos/<slug>/` y su logo en `src/assets/logos/`: en color, en la versión que se lee sobre fondo oscuro (SVG o PNG transparente). El logo hace de imagen del proyecto si no hay portada.
3. Si también es experiencia, añade una entrada en `src/data/experience.json` con `"proyecto": "<slug>"`.
4. `npm run build` y revisa `/proyectos/<slug>/`, `/ca/projectes/<slug>/` y `/en/projects/<slug>/`.
