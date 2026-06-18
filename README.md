# Tierras perdidas, sueños encontrados — Timeline

Visor estático (solo lectura) de la cronología de la campaña de D&D
**«Tierras perdidas, sueños encontrados»**, con un estilo inspirado en el
[Fantasy Timeline Maker de LegendKeeper](https://www.legendkeeper.com/free-fantasy-timeline-maker/).

El timeline va **hardcodeado**: no hay edición, login, ni carga de archivos.
Solo muestra esta cronología, lista para publicar en GitHub Pages.

## 🌐 Web publicada

Una vez activado GitHub Pages: `https://<usuario>.github.io/dndtimeline/`

## 📁 Estructura

```
Tierras perdidas, sueños encontrados.json   # export original de LegendKeeper (fuente de verdad)
build.py                                     # genera docs/data.js + docs/images/ desde el JSON
docs/                                        # <- esto es lo que sirve GitHub Pages
  index.html
  styles.css
  app.js
  data.js        (generado)
  images/        (generado, .webp optimizadas)
```

## 🔄 Cómo actualizar

1. Edita el timeline en LegendKeeper y exporta de nuevo, reemplazando
   `Tierras perdidas, sueños encontrados.json`.
2. Regenera el sitio:
   ```bash
   python3 build.py
   ```
   (Usa `cwebp` para optimizar imágenes si está instalado: `brew install webp`.)
3. Sube los cambios:
   ```bash
   git add -A && git commit -m "Update timeline" && git push
   ```
4. GitHub Pages se actualiza solo tras el push (sirve directamente la carpeta `docs/`).

## ⚙️ Detalles técnicos

- `start` de cada evento está en **minutos desde el 0001-01-01** del calendario
  Gregoriano proléptico. `build.py` lo convierte a fechas (con soporte BCE) y
  precalcula las etiquetas «N years/days later».
- Sin dependencias en el front-end: HTML + CSS + JS puro.
- Las imágenes embebidas en base64 (~23 MB) se extraen y optimizan a `.webp` (~1.7 MB).
