# Indicadores GV — Dashboard de Gestión Vehicular

Dashboard estático (HTML/JS puro, sin build) que lee y guarda sus datos en
Supabase, para poder alojarlo en GitHub + Vercel y compartirlo con un link.

## Arquitectura

```
GitHub (repo)  --push-->  Vercel (hosting estático)
                              │
                              ▼
                    index.html (navegador del usuario)
                              │  usa @supabase/supabase-js
                              ▼
                    Supabase (proyecto existente, el del GPS)
                    tabla: public.gv_indicadores_mensuales
```

- **No hay backend propio.** El navegador habla directo con Supabase usando
  la `anon key` (pensada para ser pública) y las políticas de RLS de la
  tabla son las que controlan qué se puede leer/escribir.
- La tabla usa el prefijo `gv_` para no chocar con las tablas del GPS que
  ya viven en ese mismo proyecto de Supabase.
- `dominio` (patente) es la clave natural para más adelante cruzar esta
  tabla con los datos de GPS en un panel general de vehículos.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | El dashboard completo (UI + lógica de la app + librería xlsx.js embebida) |
| `config.js` | Configuración pública: URL de Supabase, anon key, nombre de tabla |
| `supabase/schema.sql` | Script SQL para crear la tabla y sus políticas de seguridad |
| `seed_indicadores.csv` | Los datos históricos que ya tenías cargados (Jul-25 a Sep-26), listos para importar una sola vez |

## Paso 1 — Crear la tabla en Supabase

1. Entrá a tu proyecto Supabase (`https://oixzkvkybqexvrzwzwis.supabase.co`) → **SQL Editor** → *New query*.
2. Pegá el contenido de `supabase/schema.sql` y ejecutalo.
3. Esto crea la tabla `public.gv_indicadores_mensuales` con RLS habilitado
   y políticas públicas de lectura/inserción/actualización (sin borrado).

## Paso 2 — Importar los datos históricos (una sola vez)

1. En Supabase Studio: **Table Editor** → elegí `gv_indicadores_mensuales`.
2. Botón **Insert** → **Import data from CSV**.
3. Subí `seed_indicadores.csv` (1547 filas, Jul-25 a Sep-26) y confirmá el
   mapeo de columnas (debería calzar automáticamente por nombre).

## Paso 3 — Completar `config.js`

1. En Supabase: **Project Settings → API → Project API keys**.
2. Copiá la **`anon` `public`** key (¡NO la `service_role`, esa nunca va en el frontend!).
3. Pegala en `config.js`:
   ```js
   window.APP_CONFIG = {
     SUPABASE_URL: "https://oixzkvkybqexvrzwzwis.supabase.co",
     SUPABASE_ANON_KEY: "<--- pegar acá la anon key --->",
     SUPABASE_TABLE: "gv_indicadores_mensuales"
   };
   ```

## Paso 4 — Subir a GitHub

```bash
git init
git add .
git commit -m "Dashboard Indicadores GV conectado a Supabase"
git branch -M main
git remote add origin <URL_DE_TU_REPO>
git push -u origin main
```

> `config.js` sí se sube al repo: la `anon key` está diseñada para ser
> pública (la protección real es RLS), no es un secreto.

## Paso 5 — Desplegar en Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → importá el repo de GitHub.
2. Framework preset: **Other** (sitio estático).
3. Build command: dejar vacío. Output directory: `.` (raíz).
4. Deploy. Listo — te da una URL pública (`https://tu-proyecto.vercel.app`).

Cada `git push` a `main` vuelve a desplegar automáticamente.

## Uso diario

- **Cargar planilla**: botón "Cargar planilla" → se parsea el .xlsx en el
  navegador (igual que antes) y se hace un *upsert* a Supabase por
  `(mes, dominio)`. Si un vehículo de ese mes ya existía, se actualiza; si
  no, se inserta. Después se vuelve a leer todo desde Supabase para que
  el dashboard quede sincronizado.
- **Guardar**: exporta un .xlsx local de respaldo (no toca Supabase).
- **Borrar** (botón): solo limpia la vista de tu navegador. Los datos
  siguen intactos en Supabase — recargá la página para volver a verlos.
- Como no hay login, cualquiera con el link puede ver **y cargar** datos.
  Si en algún momento eso deja de ser aceptable, avisame y agregamos
  Supabase Auth (login simple) sin tener que rehacer el resto.

## Próximo paso: panel general de vehículos (GPS + Indicadores)

Cuando quieras integrar esto con el HTML del GPS:

1. Confirmame el nombre de la tabla/vista donde vive el reporte del GPS y
   qué columna identifica al vehículo (idealmente `dominio`/patente).
2. Armamos una tercera página (o una nueva pestaña dentro de este mismo
   dashboard) que traiga datos de ambas tablas y las cruce por `dominio`
   (posición actual del GPS + indicadores de gestión del mismo vehículo).

No hace falta tocar la tabla `gv_indicadores_mensuales` ni sus políticas
para eso — se puede leer en paralelo desde el mismo cliente de Supabase.
