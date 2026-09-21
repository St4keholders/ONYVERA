# ONYVERA · Corrección del precio repetido en el carrito

Documento para el agente de desarrollo. **Alcance único:** los precios de cada línea en la página de carrito y en el drawer del carrito.

**No tocar:** el carrusel de la home (funciona correctamente), el PDP, el header, ni nada del admin de Shopify.

---

## 1. El problema

Con 4 unidades en el carrito, la línea del producto muestra:

| Lugar | Muestra hoy | Debe mostrar | Campo correcto |
|---|---|---|---|
| Precio unitario (debajo del nombre), tachado | ~~$25.00~~ ✓ | ~~$25.00~~ | `item.original_price` |
| Precio unitario (debajo del nombre), final | **$80.00** ✗ | **$20.00** | `item.final_price` |
| Columna Total, tachado | ~~$80.00~~ ✗ | ~~$100.00~~ | `item.original_line_price` |
| Columna Total, final | $80.00 ✓ | $80.00 | `item.final_line_price` |

Shopify calcula bien. `/cart.js` con 4 unidades devuelve:

```json
"original_price": 2500,
"final_price": 2000,
"original_line_price": 10000,
"final_line_price": 8000
```

El tema está usando `final_line_price` en dos lugares donde no corresponde.

---

## 2. Dónde buscar

- Snippet o sección de la **página de carrito** (en temas basados en Dawn: `sections/main-cart-items.liquid`).
- Snippet del **drawer** (en Dawn: `snippets/cart-drawer.liquid`).
- Buscar `final_line_price` en ambos.
- Revisar también `assets/*.js`: si algún script escribe precios en esos nodos con `textContent` o `innerHTML`, eliminar esa escritura. Los precios deben venir solo del HTML que renderiza Liquid.

---

## 3. Corrección

**Precio por unidad** (debajo del nombre del producto):

```liquid
<div class="line-price">
  {%- if item.original_price != item.final_price -%}
    <s class="line-price__compare">{{ item.original_price | money }}</s>
    <span class="line-price__final">{{ item.final_price | money }}</span>
  {%- else -%}
    <span class="line-price__final">{{ item.original_price | money }}</span>
  {%- endif -%}
</div>
```

**Total de la línea** (columna Total):

```liquid
<div class="line-total">
  {%- if item.original_line_price != item.final_line_price -%}
    <s class="line-total__compare">{{ item.original_line_price | money }}</s>
    <span class="line-total__final">{{ item.final_line_price | money }}</span>
  {%- else -%}
    <span class="line-total__final">{{ item.original_line_price | money }}</span>
  {%- endif -%}
</div>
```

Aplicar el mismo cambio en la página de carrito **y** en el drawer. Conservar las clases y estilos que ya existen; solo cambian los campos.

---

## 4. Pruebas

Probar en la página de carrito y en el drawer:

| Unidades | Precio unitario | Columna Total |
|---|---|---|
| 1 | $25.00 | $25.00 |
| 2 | $25.00 | $50.00 |
| 3 | ~~$25.00~~ $20.00 | ~~$75.00~~ $60.00 |
| 4 | ~~$25.00~~ $20.00 | ~~$100.00~~ $80.00 |
| de 4 bajar a 2 | $25.00, sin tachado | $50.00, sin tachado |

Ningún precio tachado puede ser igual al precio final que tiene al lado.

---

## 5. Entregable

1. Archivos modificados y la línea exacta que cambió en cada uno.
2. Capturas del carrito y del drawer con 3 y con 4 unidades.
