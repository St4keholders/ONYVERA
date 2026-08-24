# PLAN.md — ONYVERA · Inicio

Plan de construcción del tema. Alcance de esta tanda: **solo la página de
inicio, 11 secciones**. Ficha de producto, páginas secundarias y políticas
quedan fuera.

Las reglas permanentes están en `CLAUDE.md`. Léelas antes de empezar.

---

## 0. Estado de partida

```
onyvera/                    # tema Dawn inicializado con shopify theme init
├── node_modules/motion/    # npm install motion
└── (estructura Dawn intacta)
```

Producto ya creado en Shopify con tres variantes bajo la opción `Package`:
`1 Bottle` · `2 Bottles` · `3 Bottles`.

**Idioma:** se construye con el copy en **español**, que es el aprobado. Como
todo texto vive en ajustes del esquema, el cambio a inglés de EE. UU. será
posterior y no requerirá tocar código. No traduzcas nada por tu cuenta.

---

## 1. Sistema de diseño

Crea `assets/onv-tokens.css` con esto y no escribas ningún valor literal fuera
de aquí.

```css
:root{
  /* color */
  --onv-green-900:#1B3A2F;
  --onv-teal-600:#2F7A6B;
  --onv-sage-400:#93A896;
  --onv-cream-50:#F6F2E9;
  --onv-stone-100:#E6E0D2;
  --onv-bamboo-500:#C6A264;
  --onv-ink:#1B3A2F;
  --onv-ink-soft:#374C43;

  /* vidrio sobre fondo claro */
  --onv-glass-bg:rgba(255,255,255,.55);
  --onv-glass-brd:rgba(255,255,255,.65);
  --onv-glass-blur:14px;
  --onv-glass-shadow:0 8px 32px rgba(27,58,47,.10);

  /* vidrio sobre fondo verde */
  --onv-glass-dark-bg:rgba(246,242,233,.12);
  --onv-glass-dark-brd:rgba(246,242,233,.28);

  /* tipografía */
  --onv-display:'Cormorant Garamond',Georgia,serif;
  --onv-body:'Karla',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  --onv-fs-h1:clamp(46px,7.4vw,92px);
  --onv-fs-h2:clamp(30px,3.6vw,44px);
  --onv-fs-h3:20px;
  --onv-fs-body:16px;
  --onv-fs-small:13px;
  --onv-fs-micro:11px;
  --onv-track-eyebrow:.18em;

  /* espaciado, base 4 */
  --onv-s1:4px;  --onv-s2:8px;  --onv-s3:12px; --onv-s4:16px;
  --onv-s5:24px; --onv-s6:32px; --onv-s7:48px; --onv-s8:64px;
  --onv-s9:96px;
  --onv-section-y:clamp(64px,9vw,120px);

  /* forma */
  --onv-r-sm:2px; --onv-r-md:8px; --onv-r-lg:20px; --onv-r-pill:999px;
  --onv-maxw:1240px;

  /* motion */
  --onv-dur-fast:180ms;
  --onv-dur-base:420ms;
  --onv-dur-slow:900ms;
  --onv-ease:cubic-bezier(.22,.9,.30,1);
}
```

Tipografías: Cormorant Garamond (600) para títulos, Karla (400/600/700) para
todo lo demás. Autoaloja los `.woff2` en `assets/` con `font-display:swap` y
`<link rel="preload">` de los dos pesos usados en el hero. No uses el CDN de
Google Fonts: añade una conexión externa que castiga el LCP.

---

## 2. Glassmorphism: dónde sí y dónde no

El vidrio necesita algo detrás que desenfocar. Sobre crema plano es invisible y
además caro. **Regla dura: nunca un panel de vidrio sobre fondo liso.**

**Sí lleva vidrio:**
| Elemento | Sobre qué |
|---|---|
| Cinta superior | verde profundo |
| Tarjetas de prueba social | manchas difuminadas salvia/bambú |
| Tabla de especificaciones | la foto de producto |
| Tarjetas de la sección de cierre | verde profundo |
| Toast de carrito | el contenido de la página |

**No lleva vidrio:** hero, cómo usar, línea de tiempo, resultados,
ingredientes, iconos. Esas van limpias sobre crema y piedra.

Crea `assets/onv-glass.css` con dos clases, `.onv-glass` y `.onv-glass--dark`,
y **verifica contraste 4.5:1 en cada una**. Añade siempre el respaldo:

```css
@supports not (backdrop-filter:blur(1px)){
  .onv-glass{background:rgba(255,255,255,.92)}
}
```

Máximo dos `backdrop-filter` visibles a la vez. Si una sección necesita más,
usa fondo sólido con transparencia.

Para las manchas difuminadas de fondo, un `radial-gradient` en un
pseudoelemento. **Nunca** un `filter:blur()` sobre un div real: fuerza una capa
enorme y hunde el móvil.

---

## 3. Motion: reglas de uso

Copia `node_modules/motion/dist/motion.min.js` a `assets/` y cárgalo como
módulo. No uses CDN externo.

```js
import { animate, inView, stagger } from "./motion.min.js";
```

**Tres patrones, y solo tres:**

1. **Entrada al aparecer.** `inView` sobre cada sección: opacidad de 0 a 1 y
   `translateY` de 16 px a 0, con `stagger(0.06)` entre hijos. Duración
   `--onv-dur-base`. Se ejecuta una sola vez.
2. **Micro-interacción.** Hover y focus en botones y tarjetas. Duración
   `--onv-dur-fast`.
3. **Hero.** Secuencia de disparo único descrita en la sección 5.

Nada más. Ni paralaje, ni contadores, ni carruseles automáticos, ni texto que
aparece letra por letra fuera del hero. Cada animación extra hace que el sitio
parezca una plantilla.

Envuelve todo con la comprobación de `prefers-reduced-motion`; si está activa,
pinta el estado final y no registres nada.

---

## 4. Añadir al carrito desde el inicio

Todos los CTA del inicio añaden al carrito sin navegar. Crea:

**`snippets/onv-add-button.liquid`** — botón que recibe `variant_id`, etiqueta y
precio. Renderiza `<button data-onv-add data-variant-id="…">` con el precio
visible dentro.

**`assets/onv-cart.js`**
```js
// POST /cart/add.js  → { items:[{ id, quantity:1 }] }
// luego GET /cart.js → actualiza el contador de la cabecera
// luego muestra el toast
```

**`snippets/onv-toast.liquid`** — toast de vidrio, esquina inferior derecha en
escritorio, franja inferior en móvil. Contiene: miniatura del producto, nombre,
cantidad, un enlace `Ver carrito` y un botón `Seguir viendo`. Entra con `animate`
en 240 ms, se va solo a los 5 s, y el temporizador se pausa al pasar el cursor.

**Accesibilidad del toast:** `role="status"` con `aria-live="polite"`, el foco
NO se mueve solo, y se cierra con `Escape`.

**Manejo de error:** si `/cart/add.js` devuelve error (sin stock, por ejemplo),
el toast muestra el mensaje real de Shopify en tono de error. Nunca falles en
silencio.

**Qué variante añaden los botones.** Ajuste de esquema `default_variant` por
sección, con `1 Bottle` como valor por defecto. El botón **siempre muestra el
precio de lo que va a añadir**; si el precio no cabe en el diseño, el botón no
puede añadir directo y debe enlazar a la ficha de producto.

Oportunidad de venta: en el toast, bajo la confirmación, una línea del tipo
`Añade un segundo frasco y ahorra $10` con su propio botón de añadir a la
variante de 2. Es el momento de máxima intención de compra.

---

## 5. Las 11 secciones

Orden en `templates/index.json`. Cada una es un archivo propio con su
`{% schema %}` y su `preset`.

### 5.1 · `onv-cinta.liquid` — cinta en loop
Marquesina sobre la cabecera. Fondo `--onv-green-900`, vidrio oscuro.
Texto único repetido: **ENVÍO GRATIS EN EE. UU. EN PEDIDOS DESDE $50**

Implementación: el texto duplicado en el marcado y una animación que desplaza
exactamente el 50 % del ancho, si no se ve un salto en cada vuelta. CSS puro,
sin JS. Se detiene con `prefers-reduced-motion`.

Ajustes: texto, velocidad (s), color de fondo, on/off.

### 5.2 · `onv-hero.liquid` — «Ya no las escondas»
La sección más importante. Prototipo funcional de referencia ya validado.

Composición: copy arriba a la izquierda, tres puntos a la derecha en escritorio,
arte anclado abajo al centro. En móvil todo se apila.

**Copy**
- Eyebrow: `SÉRUM BOTÁNICO PARA UÑAS · 16 ML`
- H1: `Ya no las escondas.`
- Subtítulo: `Un sérum con brocha de precisión que acondiciona la uña y el contorno, justo donde lo necesitas. 16 ml para manos y pies.`
- Botón: `COMPRAR ONYVERA` + precio (añade al carrito)
- Micro: `16 ml · Envío desde Orlando, FL · Envío gratis desde $50`
- Puntos: `Brocha de precisión integrada` · `16 ml para manos y pies` · `Sin parabenos ni sulfatos`

**Movimiento — modo disparo único, ya decidido**
- Al cargar y sin depender del scroll: eyebrow, luego H1 palabra por palabra
  (retardo 0.09 s entre palabras), luego subtítulo. **El titular nunca depende
  del scroll**: quien no desliza tiene que poder leerlo.
- El **primer** gesto de scroll (`wheel`, `touchmove`, `keydown` de flechas o
  espacio, o `scroll`) dispara una línea de tiempo de **900 ms** y se
  desconecta. Nunca se hace `preventDefault`.
- Tramos dentro de esa línea de tiempo, con progreso normalizado 0→1:

| Elemento | Tramo | Transformación |
|---|---|---|
| Zapato | 0 → 0.55 | `translateY 0→620px`, `rotate 0→5deg` |
| Zapato (opacidad) | 0.80 → 1 | `1 → 0` |
| Pie | 0.08 → 0.60 | `translateY 0→-22px` |
| Punto 1 | 0.35 → 0.58 | `translateX 22→0`, opacidad 0→1 |
| Punto 2 | 0.45 → 0.68 | ídem |
| Punto 3 | 0.55 → 0.78 | ídem |
| Botón | 0.62 → 0.82 | `translateY 14→0`, opacidad 0→1 |

- Contenedor de **130vh** en escritorio y **118vh** en móvil, con el bloque
  interior en `position:sticky; top:0; height:100vh`.
- Con `prefers-reduced-motion`: contenedor a 100vh, estado final pintado, sin
  escuchas.

Ajustes: las dos imágenes, los textos, la variante del botón, la duración, el
alto del contenedor, on/off del movimiento.

### 5.3 · `onv-prueba-social.liquid`
Fondo crema con manchas difuminadas. Tres tarjetas de vidrio en cuadrícula.

H2: `Lo que dicen quienes ya lo usan`

**Bloqueante conocido:** no hay reseñas reales todavía. Construye la sección
con bloques repetibles vacíos y una franja de cifras que **se oculta sola si
los ajustes están vacíos**. Cero valores por defecto inventados: ni estrellas,
ni número de pedidos, ni porcentajes.

Cada bloque: valoración, texto, nombre, ciudad, insignia de compra verificada.

### 5.4 · `onv-como-usar.liquid`
Fondo piedra, sin vidrio. Cuatro pasos en cuadrícula 2×2 en escritorio.

H2: `Cómo aplicar ONYVERA` · Sub: `Cuatro pasos. Menos de un minuto.`

1. `PASO 1 — LIMA SUAVEMENTE LA SUPERFICIE` / `Un pulido ligero retira las capas ásperas y deja la uña lista para absorber el sérum.`
2. `PASO 2 — APLICA CON LA BROCHA` / `Una capa fina sobre la uña y bajo la punta. La brocha llega hasta el borde libre sin manchar la piel de alrededor.`
3. `PASO 3 — DEJA SECAR AL AIRE` / `Sin vendajes ni algodón. La fórmula seca sola y puedes seguir con tu día.`
4. `PASO 4 — REPITE A DIARIO` / `De 3 a 6 aplicaciones al día. La constancia es lo que marca la diferencia.`

Numeración con Cormorant en grande, en bambú al 40 % de opacidad.

### 5.5 · `onv-linea-tiempo.liquid`
Fondo crema. Línea horizontal en escritorio, vertical en móvil. Sin vidrio.

H2: `Tu rutina de 4 semanas` · Sub: `Qué vas a ir notando si mantienes el hábito.`

1. `SEMANA 1 — SE VUELVE COSTUMBRE` / `Los primeros días se trata de encajar el gesto en tu rutina. La uña empieza a sentirse menos áspera al tacto.`
2. `SEMANA 2 — SUPERFICIE MÁS PAREJA` / `La textura irregular se nota más uniforme y el sérum se extiende con más facilidad.`
3. `SEMANA 3 — MEJOR ASPECTO` / `La uña luce más cuidada y el contorno se ve hidratado en vez de reseco.`
4. `SEMANA 4 — CRECIMIENTO NUEVO` / `La uña que crece desde la base se ve más limpia y pareja que la que estás dejando atrás.`

Movimiento: la línea se dibuja con `stroke-dasharray` al entrar en vista, y los
cuatro nodos aparecen escalonados detrás de ella.

### 5.6 · `onv-resultados.liquid`
Fondo verde profundo, texto crema. Una reseña de vidrio oscuro intercalada.

H2: `Volver a no pensar en tus uñas`

- `Uñas de aspecto limpio y parejo, cuidadas desde la base.`
- `Superficie suave, sin olor y fácil de cortar.`
- `Lúcelas sin dudarlo. En la playa, en sandalias o en público: cero vergüenza.`

El tercer punto va con más peso tipográfico: es el mejor argumento del sitio.

### 5.7 · `onv-ingredientes.liquid`
Fondo crema. Cinco tarjetas más la lista INCI en un desplegable.

H2: `Cinco botánicos activos. Diez ingredientes. Nada escondido.`
Sub: `La lista completa, en el mismo orden que aparece en el frasco.`

- `Aceite de árbol de té (Melaleuca Alternifolia):` `aceite botánico muy apreciado en el cuidado de uñas y piel por su acabado limpio y purificante.`
- `Aloe vera:` `acondiciona y calma la piel alrededor del lecho ungueal.`
- `Glicerina:` `atrae y retiene la humedad en uñas secas y quebradizas.`
- `Provitamina B5 (Pantenol):` `aporta suavidad y flexibilidad a la uña.`
- `Vitamina E (Acetato de tocoferilo):` `protección antioxidante para uñas castigadas.`

INCI, **no se traduce ni se altera el orden**:
`Water (Aqua), Glycerin, Aloe Barbadensis Leaf Juice, Panthenol, Tocopheryl Acetate, Melaleuca Alternifolia (Tea Tree) Leaf Oil, Caprylyl Glycol, Phenoxyethanol, Xanthan Gum, Citric Acid.`

Desplegable con `<details>` nativo, no con JS.

### 5.8 · `onv-especificaciones.liquid`
Dos columnas: foto de producto a la izquierda, tabla de vidrio flotando sobre
ella a la derecha, ligeramente superpuesta. Es el único sitio donde el vidrio
puede solaparse con una imagen.

| Campo | Valor |
|---|---|
| Nombre del producto | ONYVERA Sérum para uñas |
| Tipo de producto | Sérum acondicionador para uñas y cutículas |
| Contenido neto | 16 ml / 0.5 fl oz |
| Aplicador | Brocha de precisión |
| Uso | Uñas de manos y pies |
| Fórmula | 5 activos botánicos · 10 ingredientes en total |
| Duración estimada | *(pendiente del cliente — deja el ajuste vacío)* |
| Tras la apertura | 12 meses (12M) |
| Conservación | Uso externo. Lugar fresco y seco, sin sol directo. |
| Fabricante | VITAHERB INTERNATIONAL LLC · Orlando, FL |

Filas como bloques repetibles. Las vacías no se renderizan.

### 5.9 · `onv-iconos.liquid`
Franja horizontal, fondo piedra, cinco iconos SVG en línea. Sin vidrio.

`Fórmula botánica concentrada` · `Sin parabenos ni sulfatos` ·
`Vegano y libre de crueldad` · `Suave, no escuece` · `Se envía desde EE. UU.`

Iconos de trazo, 1.6 px, en `--onv-teal-600`. Nada de emojis.

### 5.10 · `onv-cierre-cta.liquid`
Fondo verde profundo. Tarjetas de vidrio oscuro. Es el cierre de la página.

H2: `Doble acción: hidrata y renueva`
Cuerpo: `Acondiciona en profundidad el lecho ungueal mientras exfolia y renueva las capas superficiales ásperas y dañadas. Un solo gesto, dos trabajos.`

Tres razones: `Formulado y envasado en Orlando, Florida.` ·
`Brocha de precisión integrada, no gotero ni roll-on.` ·
`Diez ingredientes, todos listados. Sin parabenos ni sulfatos.`

Cierre: `Aclara tus uñas. Recupera tu confianza.`
Botón: `PIDE ONYVERA` + precio (añade al carrito)
Micro: `Envío gratis desde $50 · Despacho en 24 h desde Orlando`

### 5.11 · Pie de página
Personaliza el de Dawn. Enlaces a las páginas secundarias (aún no existen: deja
los enlaces configurables y vacíos por ahora). Datos de la empresa.

**Aviso legal obligatorio**, en micro:
`Estas afirmaciones no han sido evaluadas por la Administración de Alimentos y Medicamentos (FDA). Este producto no está destinado a diagnosticar, tratar, curar ni prevenir ninguna enfermedad.`

---

## 6. Assets placeholder

No hay fotografía todavía. Se arranca con SVG y se sustituye después.

Genera en `assets/`:
- `onv-ph-pie.svg` — pie visto desde arriba, dedos hacia arriba, uñas visibles,
  relleno con degradado en tonos cálidos neutros.
- `onv-ph-zapato.svg` — zapato genérico que **cubre el pie por completo**.
  Sin logos, sin siluetas de marca registrada.
- `onv-ph-producto.svg` — frasco con brocha, para especificaciones.

Cada campo de imagen es un `image_picker` del esquema que **cae al SVG cuando
está vacío**. Así sustituir por fotos reales es arrastrar y soltar, sin tocar
código.

Marca cada uso con `{% comment %} ASSET-TODO: … {% endcomment %}` y mantén un
`ASSETS.md` en la raíz con la lista de lo que falta producir y sus
especificaciones (formato, medidas, peso máximo).

---

## 7. Fases de ejecución

Una fase, un commit, una pausa para revisión. No encadenes fases sin validar.

| Fase | Contenido | Se da por hecha cuando |
|---|---|---|
| **A** | `onv-tokens.css`, `onv-glass.css`, fuentes autoalojadas, Motion en `assets/`, `layout/theme.liquid` limpio | La home carga en blanco sin errores de consola |
| **B** | `onv-cinta` + `onv-hero` + placeholders SVG | El hero se ve y anima igual que el prototipo aprobado |
| **C** | `onv-add-button`, `onv-cart.js`, `onv-toast` | Añadir al carrito funciona con contador y toast, con error controlado |
| **D** | Secciones 5.3 a 5.7 | Cada una responsive y con su entrada al aparecer |
| **E** | Secciones 5.8 a 5.11 | Ídem, y `templates/index.json` con las 11 en orden |
| **F** | Auditoría | Presupuesto de rendimiento, contraste, teclado, reduced-motion |

---

## 8. Criterios de aceptación

- [ ] Las 11 secciones son añadibles, movibles y editables desde el personalizador.
- [ ] Ningún texto visible está hardcodeado en el marcado.
- [ ] Ningún claim prohibido según `CLAUDE.md`.
- [ ] Sin cifras de prueba social inventadas.
- [ ] Lighthouse móvil: rendimiento 90+, accesibilidad 100.
- [ ] LCP bajo 2.5 s, CLS bajo 0.1, JS bajo 120 KB comprimido.
- [ ] Con `prefers-reduced-motion` el sitio es legible y completo, sin movimiento.
- [ ] Navegable solo con teclado, con foco visible en todo momento.
- [ ] Correcto a 375, 768, 1024 y 1440 px.
- [ ] Contraste 4.5:1 verificado en cada panel de vidrio.
- [ ] Añadir al carrito funciona desde todos los CTA, con toast y con error controlado.
- [ ] Los botones que añaden directo muestran el precio de lo que añaden.

---

## 9. Pendiente del cliente, fuera del alcance de Claude Code

1. **Cuántos días rinde un frasco** a 3–6 aplicaciones diarias. Bloquea la fila
   de duración y los nombres de los paquetes.
2. **Fotografía real** del pie, el zapato y el producto. Misma sesión, mismo
   ángulo, misma luz, fondos transparentes, sombras en archivo aparte.
3. **Certificación vegano y libre de crueldad**, o se retira ese icono.
4. **Reseñas verificadas** por app cuando lleguen pedidos reales.
5. **Traducción a inglés de EE. UU.**, que es reescritura publicitaria, no
   traducción literal. Se hace al final, sobre los ajustes del esquema.
