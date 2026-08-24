# CLAUDE.md — ONYVERA

Reglas permanentes de este repositorio. Aplican a toda sesión, sin excepción.
El trabajo secuencial está en `PLAN.md`.

---

## Qué es este proyecto

Tema de Shopify en Liquid para **onyveranails.com**, tienda de un solo producto
(ONYVERA, sérum acondicionador para uñas, 16 ml, tres variantes de paquete).
Base: tema Dawn. Plan Shopify Basic. Mercado: Estados Unidos.

---

## Restricciones de plataforma

- **No se toca el checkout.** El plan Basic no lo permite. Cualquier tarea que
  requiera modificarlo se detiene y se reporta.
- **No se instalan apps** sin autorización explícita del usuario.
- **No se ejecuta `shopify theme push`** sin que el usuario lo pida. El trabajo
  se valida con `shopify theme dev`.
- **No se edita código directamente en el admin de Shopify.** Todo pasa por Git.

---

## Regla de cumplimiento normativo — LA MÁS IMPORTANTE

Este producto es un **cosmético**, no un medicamento. Escribir un claim
terapéutico lo convierte legalmente en un medicamento no aprobado ante la FDA
y bloquea la publicidad en Meta y Google.

**Prohibido escribir, sugerir o "mejorar" copy con:**

- Verbos de tratamiento: curar, tratar, eliminar, erradicar, combatir, matar,
  neutralizar, detener — aplicados a hongos, infecciones o enfermedades.
- Las palabras `antifungal`, `antifúngico`, `fungus`, `hongo`, `infección`,
  `onicomicosis` en cualquier texto visible.
- Superlativos comparativos: `#1`, `el mejor`, `máxima potencia`,
  `maximum strength`, `grado clínico`.
- La palabra `seguro` / `safe` como atributo del producto.
- Promesas de plazo: `resultados en X semanas`, `garantizado`.
- Cifras de prueba social inventadas (reseñas, valoraciones, número de clientes).

**Permitido:** apariencia, textura, hidratación, acondicionamiento, formato de
aplicación, composición, origen, hábito de uso.

Si una tarea parece exigir un claim prohibido, **no lo escribas**: detente y
pregunta. Nunca lo resuelvas por tu cuenta reformulando con sinónimos.

---

## Convenciones de código

### Liquid
- Prefijo `onv-` en todo archivo propio: `sections/onv-hero.liquid`.
- **Toda sección lleva `{% schema %}`** con `presets`, para que sea añadible y
  editable desde el personalizador.
- **Todo texto visible es un ajuste del esquema.** Cero strings hardcodeados en
  el marcado. Esto es lo que permitirá cambiar el sitio de español a inglés sin
  tocar una línea de código.
- Precios siempre con el filtro `| money`. Nunca formateo manual.
- Nunca hardcodear IDs de variante. Se resuelven vía `product.variants` o un
  ajuste de esquema.
- Imágenes con `image_url: width:` + `image_tag` y `srcset` responsive.

### CSS
- Un solo archivo de tokens: `assets/onv-tokens.css`. Ningún valor de color,
  espaciado o tipografía se escribe literal fuera de ahí.
- Nomenclatura BEM con prefijo: `.onv-hero__title`.
- Nada de `!important`. Si hace falta, la especificidad está mal planteada.
- Mobile first. Breakpoints: 480, 760, 990, 1240.

### JavaScript
- ES módulos, sin jQuery, sin bundler. Shopify sirve los archivos de `assets/`
  tal cual.
- Animación: **solo la API vanilla de Motion** (`import { animate, scroll,
  inView, stagger } from "motion"`). `motion/react` NO aplica: esto no es React.
- Solo se animan `transform` y `opacity`. Nunca `left`, `top`, `width`,
  `height` ni `margin`.
- Todo listener de scroll es `{ passive: true }`. Nunca `preventDefault` sobre
  el scroll del usuario.
- Todo lo que anime respeta `prefers-reduced-motion: reduce` mostrando el estado
  final sin transición.

---

## Presupuesto de rendimiento (bloqueante)

| Métrica | Límite |
|---|---|
| JS total en la home | 120 KB comprimido |
| LCP | menos de 2.5 s |
| CLS | menos de 0.1 |
| `backdrop-filter` simultáneos en pantalla | máximo 2 |
| Peso de cada imagen | menos de 200 KB |

Si un cambio rompe el presupuesto, se reporta antes de continuar.

---

## Accesibilidad (no negociable)

- Contraste mínimo 4.5:1 en todo texto. **Se verifica explícitamente en cada
  panel de vidrio**, que es donde más falla.
- Foco visible en todo elemento interactivo. Nunca `outline: none` sin
  reemplazo.
- Toda imagen decorativa con `alt=""`; toda imagen informativa con alt real.
- Los SVG de icono llevan `aria-hidden="true"`; el texto adyacente da el
  significado.
- Nada comunicado solo por color.

---

## Flujo de trabajo

- Rama por sección: `feat/onv-hero`. Nunca commits directos a `main`.
- Commits en Conventional Commits: `feat(hero): ...`, `fix(cart): ...`.
- Un commit por sección terminada, no un commit gigante al final.
- Antes de dar una sección por hecha: probarla a 375, 768 y 1440 px, con
  `prefers-reduced-motion` activo y con navegación por teclado.

---

## Cómo pedir ayuda

Detente y pregunta cuando:
- Una tarea requiera un claim prohibido.
- Falte un asset y no exista placeholder definido.
- Haya que instalar una app o subir de plan.
- El presupuesto de rendimiento se rompa.
- Una decisión de diseño no esté cubierta por `PLAN.md`.

No adivines. Una pregunta cuesta un minuto; una sección mal construida cuesta
una tarde.
