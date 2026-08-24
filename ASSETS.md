# ASSETS.md — Especificaciones de Recursos Gráficos ONYVERA

Lista y especificaciones técnicas de los recursos fotográficos y gráficos pendientes de producción para sustituir los placeholders SVG temporales.

---

## 1. Hero: Pie cenital
- **Identificador**: `onv-ph-pie.svg` -> `assets/onv-pie-real.png` / `onv-pie-real.webp`
- **Ubicación**: Hero Section (`sections/onv-hero.liquid`)
- **Especificaciones**:
  - **Formato**: WebP o PNG transparente (sin fondo).
  - **Dimensiones recomendadas**: 800 × 1300 px (2x retina).
  - **Peso máximo**: < 180 KB.
  - **Toma / Ángulo**: Pie visto exactamente desde arriba (ángulo cenital de 90°), dedos orientados hacia arriba, uñas limpias y bien iluminadas. Fondo completamente transparente.
  - **Iluminación**: Luz suave, neutra, difusa, sin sombras duras en el archivo (la sombra se genera por CSS).

## 2. Hero: Zapato superpuesto
- **Identificador**: `onv-ph-zapato.svg` -> `assets/onv-zapato-real.png` / `onv-zapato-real.webp`
- **Ubicación**: Hero Section (`sections/onv-hero.liquid`)
- **Especificaciones**:
  - **Formato**: WebP o PNG transparente (sin fondo).
  - **Dimensiones recomendadas**: 800 × 1300 px (debe calzar exactamente con el pie de la misma sesión fotográfica).
  - **Peso máximo**: < 180 KB.
  - **Toma / Ángulo**: Zapato casual/lifestyle elegante que cubra por completo la silueta del pie en idéntico ángulo y perspectiva.
  - **Iluminación**: Coincidente con la sesión del pie.

## 3. Fotografía de Producto / Especificaciones
- **Identificador**: `onv-ph-producto.svg` -> `assets/onv-producto-real.png` / `onv-producto-real.webp`
- **Ubicación**: Sección de Especificaciones (`sections/onv-especificaciones.liquid`) y Toast
- **Especificaciones**:
  - **Formato**: WebP / PNG transparente.
  - **Dimensiones recomendadas**: 800 × 1200 px.
  - **Peso máximo**: < 160 KB.
  - **Toma**: Frasco de vidrio 16 ml con tapón y aplicador de brocha visible, etiqueta frontal legible.
