# Guía de Inicio Rápido en Windows — ONYVERA

Esta guía está diseñada paso a paso para que cualquier persona, sin importar su experiencia técnica, pueda levantar y visualizar la tienda **ONYVERA** en su computadora.

---

## 📋 Requisitos Previos

Solo necesitas tener instalado **Node.js** (versión 18 o superior).

### Paso 1: Verificar Node.js
1. Abre tu terminal (**PowerShell** o **Símbolo del sistema** en Windows).
2. Escribe el siguiente comando y presiona `Enter`:
   ```bash
   node -v
   ```
3. Deberías ver un número como `v18.x.x`, `v20.x.x` o superior.
   - *Si no aparece o dice que no se reconoce, descarga e instala la versión LTS desde [nodejs.org](https://nodejs.org).*

---

## 🛠️ Instalación del Shopify CLI

### Paso 2: Instalar Shopify CLI en tu equipo
En la misma terminal, ejecuta:
```bash
npm install -g @shopify/cli@latest
```
*(Espera unos segundos hasta que termine la descarga).*

### Paso 3: Reiniciar la terminal (Muy importante)
Cierra la ventana de PowerShell/Terminal y vuelve a abrirla en la carpeta del proyecto `ONYVERA`. Esto permite que Windows reconozca el nuevo comando `shopify`.

---

## 🚀 Iniciar la Tienda en Local

### Paso 4: Ejecutar el servidor de desarrollo
En la terminal, dentro de la carpeta del proyecto, escribe:
```bash
shopify theme dev --store 3qgut0-ke.myshopify.com
```

### ¿Qué sucederá después?
1. Se abrirá automáticamente una pestaña en tu navegador para que inicies sesión con tu cuenta de Shopify (solo la primera vez).
2. La terminal mostrará dos enlaces:
   - **Vista previa local:** `http://127.0.0.1:9292` (este es el enlace que abres para ver tu tienda en vivo mientras trabajas).
   - **Editor del personalizador:** Un enlace especial para editar textos, fotos y bloques en tiempo real.

---

## ⚠️ Solución de Errores Comunes en Windows

### 1. "El término 'shopify' no se reconoce como nombre de un cmdlet..."
- **Causa:** Windows aún no ha actualizado las rutas de tus programas instalados.
- **Solución:**
  1. Cierra completamente la terminal (y tu editor de código si lo tienes abierto) y vuelve a abrirlo.
  2. Si persiste, puedes ejecutar el comando directamente con `npx`:
     ```bash
     npx @shopify/cli theme dev --store 3qgut0-ke.myshopify.com
     ```

### 2. El proyecto está dentro de OneDrive y se congela o da error de archivos
- **Causa:** OneDrive sincroniza archivos en segundo plano y puede bloquear momentáneamente archivos temporales de Shopify.
- **Solución:**
  - Si experimentas lentitud o errores de "archivo en uso (EPERM)", pausa la sincronización de OneDrive temporalmente mientras trabajas, o mueve la carpeta `ONYVERA` a una ruta local fuera de OneDrive (ejemplo: `C:\Desarrollos\ONYVERA`).

### 3. Fallo de autenticación o la ventana de login no se abre
- **Causa:** El navegador bloqueó la ventana emergente o la sesión caducó.
- **Solución:**
  1. Fuerza el cierre de sesión escribiendo:
     ```bash
     shopify auth logout
     ```
  2. Vuelve a iniciar sesión con:
     ```bash
     shopify auth login --store 3qgut0-ke.myshopify.com
     ```
  3. Asegúrate de permitir las ventanas emergentes en tu navegador predeterminado (Chrome, Edge, etc.).
