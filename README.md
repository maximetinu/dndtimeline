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

## 🔄 Cómo actualizar (automático)

1. Edita el timeline en LegendKeeper y exporta de nuevo, reemplazando
   `Tierras perdidas, sueños encontrados.json`.
2. Sube el cambio:
   ```bash
   git add -A && git commit -m "Update timeline" && git push
   ```

¡Y ya está! Un **GitHub Action** (`.github/workflows/deploy.yml`) corre `build.py`
en la nube en cada push, regenera `docs/data.js` + `docs/images/` y despliega a
GitHub Pages automáticamente. No necesitas correr nada en local.

> Los archivos generados (`docs/data.js`, `docs/images/`) están en `.gitignore`
> a propósito: los reconstruye el Action, no se commitean.

### Previsualizar en local (opcional)

```bash
python3 build.py          # genera docs/data.js + docs/images/
cd docs && python3 -m http.server 8000   # abre http://localhost:8000
```
(`build.py` usa `cwebp` para optimizar imágenes si está instalado: `brew install webp`.)

## ⚙️ Detalles técnicos

- `start` de cada evento está en **minutos desde el 0001-01-01** del calendario
  Gregoriano proléptico. `build.py` lo convierte a fechas (con soporte BCE) y
  precalcula las etiquetas «N years/days later».
- Sin dependencias en el front-end: HTML + CSS + JS puro.
- Las imágenes embebidas en base64 (~23 MB) se extraen y optimizan a `.webp` (~1.7 MB).
