# ONYVERA · SEO técnico del tema

Documento para el agente de desarrollo. **Alcance:** solo código del tema.

**Trabajo en dos fases.** La Fase 1 es una auditoría: leer, medir y reportar **sin modificar un solo archivo**. La Fase 2 son las correcciones, y solo empieza cuando el equipo apruebe el informe.

---

## 0 · Contexto

- Tienda Shopify. Dominio principal: `https://onyveranails.com` (sin www).
- **Idioma del sitio: español.** Mercado: hispanohablantes en EE. UU.
- Producto único. Handle actual: `serum-botanico-unas-onyvera`.
- El titular de la home (*"Watch the yellow disappear"*) está **quemado dentro de la imagen del hero**. No existe como texto en el DOM.
- Ya están configurados en el admin y **no se tocan**: título y meta descripción de la home, título y meta del producto, favicon, dominio principal.
- Las reseñas de la home son **contenido de prueba**, ocultas tras un setting. No son clientes reales.

**No tocar:**
- El carrusel "Los favoritos de nuestros clientes" (funciona correctamente).
- La lógica de precios del carrito, el drawer y el PDP (se corrige en otro documento).
- Nada del admin de Shopify.
- El diseño visual. Ningún cambio de esta lista debe alterar cómo se ve el sitio.

---

# FASE 1 · Auditoría

No modificar archivos. Entregar un informe con los hallazgos y **detenerse ahí**.

### 1.1 Etiquetas del `<head>`

Abrir el HTML renderizado (no el Liquid) de la home, del producto, de una página de contenido y del carrito. Para cada una, reportar:

- ¿Cuántas veces aparece `<title>`? ¿Y `<meta name="description">`? ¿Y `<link rel="canonical">`? Cualquier número distinto de 1 es un error.
- ¿Qué contenido tienen exactamente? Pegarlo literal en el informe.
- ¿El `canonical` apunta a `https://onyveranails.com/...` sin www y sin parámetros?
- ¿Existen `og:title`, `og:description`, `og:url`, `og:image`, `og:type`, `og:locale` y `twitter:card`? ¿Con qué valores?
- ¿`<html lang="…">` devuelve `es`?

### 1.2 Encabezados

Para la home, el producto y una página de contenido, listar **en orden** todos los `h1`–`h6` con su texto.

Reportar específicamente:
- Cuántos `h1` tiene cada página. Debe ser exactamente uno.
- Si la home tiene cero `h1` (lo esperado, por el hero quemado en imagen).
- Saltos de nivel (un `h3` sin `h2` antes).
- Títulos de sección que sean `h1` en lugar de `h2`.

### 1.3 Datos estructurados (JSON-LD)

- Listar todos los bloques `application/ld+json` de la home y del producto, con su `@type`.
- ¿Hay más de un bloque `Product` en la página de producto? Es un error frecuente cuando el tema ya imprime `{{ product | structured_data }}` y alguien agregó otro.
- ¿Existe `Organization` o `WebSite` en la home?
- ¿Algún bloque incluye `AggregateRating` o `Review`? **Debe reportarse de inmediato:** las reseñas del sitio son de prueba y marcarlas como datos estructurados envía valoraciones falsas a Google.
- Validar home y producto en el Rich Results Test de Google y adjuntar capturas.

### 1.4 Imágenes

Inventario en tabla de **todas** las imágenes de la home y del producto:

| Archivo | Sección | ¿Tiene `alt`? | Texto del `alt` | Peso | Formato | `loading` | ¿`width`/`height`? |

Marcar en rojo:
- `alt` vacío o ausente en imágenes con contenido (las decorativas del footer deben tener `alt=""`, eso es correcto).
- `alt` en inglés.
- Archivos por encima de 300 KB.
- PNG o JPG donde debería haber WebP.
- La imagen del hero con `loading="lazy"` (debe ser `eager`).
- Imágenes sin `width` y `height` declarados.

### 1.5 Rendimiento

Medir con PageSpeed Insights, **pestaña móvil**, en la home y en la página de producto. Reportar LCP, CLS, INP y la puntuación de rendimiento. Estas son las cifras "antes".

Identificar además:
- Qué elemento es el LCP en cada página.
- Cuántos pesos de fuente se cargan y cuántos se precargan.
- Scripts bloqueantes en el `<head>`.

### 1.6 Enlaces e indexación

- ¿Hay enlaces a producto con el filtro `| within: collection`? Generan URLs duplicadas del tipo `/collections/x/products/y`.
- ¿Hay handles, IDs de variante o URLs absolutas escritas a mano en el código? Listar archivo y línea.
- ¿Alguna plantilla pública emite `noindex`?
- ¿Se modificó `robots.txt.liquid`? Si está intacto, dejarlo así.

### 1.7 Idioma

Listar todo el texto visible que siga en inglés dentro del tema: botones, etiquetas, mensajes de error, textos del carrito, del footer, de los formularios. Indicar archivo y línea. **No traducir todavía**, solo listar.

---

## Entregable de la Fase 1

Un informe con:

1. Las tablas y listados de los puntos 1.1 a 1.7.
2. Los errores ordenados por impacto, del más grave al más leve.
3. Las capturas del Rich Results Test y de PageSpeed.
4. Cualquier hallazgo inesperado (apps inyectando código, scripts de terceros, etiquetas duplicadas).

**Detenerse aquí y esperar aprobación antes de pasar a la Fase 2.**

---

# FASE 2 · Correcciones

Solo tras aprobar el informe. Trabajar sobre una **copia del tema** y publicar únicamente cuando todo esté verificado.

### 2.1 `h1` de la home — prioridad máxima

La home no tiene encabezado en el código porque el titular vive dentro de la imagen del hero. Para Google es una página sin título.

**Solución inmediata:** dentro de la sección del hero, como primer elemento,

```liquid
<h1 class="visually-hidden">Sérum botánico para uñas amarillas y quebradizas</h1>
```

Usar el patrón `sr-only` estándar (clip, 1px, overflow hidden). **No usar `display: none`**: eso también lo oculta para Google y para los lectores de pantalla.

Exponer el texto como setting de la sección para que el equipo pueda editarlo.

> Nota para el equipo: esto es un parche. La solución correcta es montar el titular del hero como texto HTML sobre la imagen, en lugar de quemarlo en el pixel. Además de SEO, así el texto escala solo en móvil y se puede traducir. Queda como mejora pendiente.

### 2.2 Verificar el resto de encabezados

- Los títulos de sección de la home (`LOS FAVORITOS DE NUESTROS CLIENTES`, `PROCESO REAL · 45 DÍAS`, etc.) deben ser `h2`.
- Página de producto: `h1` = título del producto, y ninguno más.
- Carrito: `h1` = "Tu carrito", y ninguno más.
- Sin saltos de nivel.

### 2.3 Datos estructurados

**Home** — agregar, si la auditoría confirmó que no existen:

```liquid
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ONYVERA",
  "legalName": "Vitaherb International LLC",
  "url": {{ shop.url | json }},
  {% if settings.logo %}"logo": {{ settings.logo | image_url: width: 512 | prepend: 'https:' | json }},{% endif %}
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Orlando",
    "addressRegion": "FL",
    "addressCountry": "US"
  }
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "ONYVERA",
  "url": {{ shop.url | json }}
}
</script>
```

Esto es lo que hace que Google muestre **ONYVERA** en vez de `onyveranails.com` encima del resultado de búsqueda.

No agregar `SearchAction`: Google retiró el cuadro de búsqueda de sitelinks.

**Producto:**
- Si el tema ya imprime `{{ product | structured_data }}`, conservar **ese** y no agregar otro bloque `Product`. Si no existe, agregarlo.
- Nunca dos bloques `Product` en la misma página.
- **No incluir `AggregateRating` ni `Review`** mientras las reseñas sean de prueba. Si la auditoría encontró alguno, eliminarlo.
- `BreadcrumbList` si la página tiene migas de pan.

Validar ambas páginas en el Rich Results Test tras el cambio.

### 2.4 Textos alternativos

Todas las imágenes con contenido llevan `alt` descriptivo **en español**. La home es casi toda imágenes generadas: sin `alt`, Google no sabe qué hay en ella.

Regla general: `{{ image.alt | default: product.title | escape }}`, y cuando el `alt` se escribe en el código de la sección, que sea editable como setting.

Imágenes decorativas (los fondos del footer): `alt=""` y `aria-hidden="true"`. Eso es correcto y no se cambia.

Textos sugeridos:

| Imagen | `alt` |
|---|---|
| Hero | `Aplicación del sérum ONYVERA con brocha de precisión sobre una uña del pie` |
| Cinta de ingredientes | `Árbol de té, aloe vera, glicerina y vitamina E junto al frasco de ONYVERA` |
| Banner de rutina | `La rutina ONYVERA en cuatro pasos: limar, aplicar, dejar absorber y repetir` |
| Día 1 / 15 / 30 / 45 | `Uña del pie en el día N del proceso` (adaptar a cada una) |
| CTA final | `Frasco de sérum ONYVERA sostenido entre dos dedos` |
| Fondos del footer | `alt=""` |

### 2.5 Imágenes y rendimiento

- **LCP:** la imagen del hero lleva `loading="eager"`, `fetchpriority="high"` y un `<link rel="preload" as="image">` en el `<head>` con el mismo `srcset` y `sizes`.
- Todas las demás: `loading="lazy"` y `decoding="async"`.
- `width` y `height` declarados en todas, para evitar saltos de layout (CLS).
- `srcset` con `image_url` y varios anchos; `sizes` acorde al layout real.
- Servir WebP. Comprimir cualquier archivo por encima de 300 KB.
- Los fondos del footer van bajo un velo casi opaco: pueden exportarse a menor resolución sin pérdida visible.
- Precargar solo dos pesos de fuente (el serif de titulares y el sans de texto). Scripts propios con `defer`.

**Objetivos en móvil:** LCP ≤ 2.5 s · CLS ≤ 0.1 · INP ≤ 200 ms.

### 2.6 `<head>`

Corregir solo lo que la auditoría marcó como roto:

```liquid
<title>{{ page_title }}{% unless page_title contains shop.name %} | {{ shop.name }}{% endunless %}{% if current_page != 1 %} – Página {{ current_page }}{% endif %}</title>
{% if page_description %}<meta name="description" content="{{ page_description | escape }}">{% endif %}
<link rel="canonical" href="{{ canonical_url }}">
<meta property="og:locale" content="es_US">
```

Open Graph completo: `og:title`, `og:description`, `og:url` (igual al canonical), `og:site_name`, `og:type` (`product` en el PDP, `website` en el resto), `og:image` en https con `og:image:width` y `og:image:height`, y `twitter:card` = `summary_large_image`.

`<html lang="{{ request.locale.iso_code }}">` debe renderizar `es`.

No agregar `hreflang` manual: Shopify ya los genera automáticamente y está activado en Preferencias.

### 2.7 URLs limpias

- Eliminar el filtro `| within: collection` en todos los enlaces a producto. Deben apuntar a `/products/<handle>`, nunca a `/collections/<x>/products/<handle>`.
- Reemplazar cualquier handle, ID o URL escrita a mano por `product.url`, `routes.*` o un setting. El handle ya cambió una vez y puede volver a cambiar.

### 2.8 Indexación

- No modificar `robots.txt.liquid`. Shopify ya bloquea `/cart`, `/checkout`, `/account` y `/search`.
- Ninguna plantilla pública puede emitir `noindex`.

### 2.9 Textos en inglés

Traducir al español los textos del tema listados en el punto 1.7. Usar los archivos de `locales/` cuando el tema los soporte, en vez de escribir el texto directo en el Liquid.

No tocar los textos que salen del admin (nombres de producto, opciones, variantes): esos los edita el equipo.

---

## Entregable de la Fase 2

1. Lista de archivos modificados y qué cambió en cada uno.
2. Capturas del Rich Results Test de home y producto, ya validadas.
3. Cifras de PageSpeed móvil **antes y después**, en ambas páginas.
4. Confirmación de que el sitio se ve exactamente igual que antes: ningún cambio visual.
5. Lista de lo que quedó pendiente y por qué.

---

## No hacer

- No modificar nada en el admin de Shopify.
- No tocar el carrusel de la home ni la lógica de precios del carrito o del PDP.
- No cambiar el diseño, los colores, la tipografía ni el layout.
- No instalar apps de SEO.
- No agregar `AggregateRating` ni `Review` mientras las reseñas sean de prueba.
- No hardcodear handles, IDs ni URLs absolutas.
- No publicar la copia del tema hasta que el equipo apruebe el resultado.
