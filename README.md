# Indicadores GV — Dashboard de Gestión Vehicular

Dashboard estático (HTML/JS puro, sin build) que lee y guarda sus datos en
Supabase, para poder alojarlo en GitHub + Vercel y compartirlo con un link.

Este HTML es independiente del dashboard de GPS — viven como páginas
separadas en el mismo repo (o en repos separados, como prefieras). Más
adelante se puede armar una tercera página que combine ambos.

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
- La tabla usa el prefijo `gv_` para no chocar con las tablas del GPS
  (por ejemplo una tabla `vehiculos` que ya exista ahí).
- `dominio` (patente) es la clave natural para más adelante cruzar esta
  tabla con los datos de GPS en un panel general de vehículos.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | El dashboard completo (UI + lógica de la app + librería xlsx.js embebida) |
| `config.js` | Configuración pública: URL de Supabase, anon key, nombre de tabla |
| `supabase/schema.sql` | Script SQL para crear la tabla y sus políticas de seguridad |
| `Historico_Indicadores_GV.xlsx` | Los datos históricos que ya tenías cargados (Jul-25 a Jul-26, 1547 filas), en el mismo formato de planilla mensual de siempre |

> ⚠️ **No uses el importador de CSV de Supabase Studio** (Table Editor →
> Insert → Import data from CSV) para el histórico. Ese camino exige
> matchear columnas y tipos a mano y es fácil terminar apuntando a una
> tabla equivocada — de ahí el error "DATA INCOMPATIBLE" con la tabla
> `vehiculos`. El camino correcto es subir el `.xlsx` desde el propio
> dashboard (Paso 5 más abajo): usa el mismo parseo y el mismo *upsert*
> que vas a usar todos los meses, así que no puede haber mismatch.

## Paso 1 — Crear la tabla en Supabase

1. Entrá a tu proyecto Supabase (`https://oixzkvkybqexvrzwzwis.supabase.co`) → **SQL Editor** → *New query*.
2. Pegá el contenido de `supabase/schema.sql` y ejecutalo.
3. Esto crea la tabla `public.gv_indicadores_mensuales` (nueva, no toca
   ninguna tabla existente del GPS) con RLS habilitado y políticas
   públicas de lectura/inserción/actualización (sin borrado).
4. Verificá en **Table Editor** que `gv_indicadores_mensuales` aparezca
   en la lista, vacía.

## Paso 2 — Completar `config.js`

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

## Paso 3 — Subir a GitHub

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

## Paso 4 — Desplegar en Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → importá el repo de GitHub.
2. Framework preset: **Other** (sitio estático).
3. Build command: dejar vacío. Output directory: `.` (raíz).
4. Deploy. Listo — te da una URL pública (`https://tu-proyecto.vercel.app`).

Cada `git push` a `main` vuelve a desplegar automáticamente.

## Paso 5 — Cargar el histórico (una sola vez)

1. Abrí la URL de Vercel.
2. Tocá **"Cargar planilla"** y seleccioná `Historico_Indicadores_GV.xlsx`
   (tiene 13 hojas, una por mes, igual que tu planilla de siempre).
3. El dashboard va a parsear las 1547 filas y hacer el *upsert* a
   Supabase — vas a ver una barra arriba con el progreso ("Guardando en
   Supabase… x/1547"). Al terminar, se recarga con todo el histórico ya
   visible.

Si por error lo cargás dos veces no pasa nada: el *upsert* es por
`(mes, dominio)`, así que la segunda vez actualiza en lugar de duplicar.

## Uso mensual (de acá en adelante)

1. Cada mes, abrís el link del dashboard.
2. Tocás **"Cargar planilla"** y subís el Excel de ese mes (mismo formato
   de siempre: una fila por vehículo, con "Mes y Año" identificando el
   período).
3. El navegador parsea el archivo y hace *upsert* a Supabase por
   `(mes, dominio)`:
   - Vehículo nuevo ese mes → se inserta.
   - Vehículo que ya estaba para ese mes → se actualiza (por si subís
     una corrección).
4. El dashboard se refresca automáticamente leyendo todo desde Supabase.

**Importante:** subí siempre la hoja completa del mes, no solo los
cambios. El *upsert* no borra nada — si un vehículo sale de la flota y
no lo incluís, su fila del mes anterior queda como estaba.

- **Guardar**: exporta un `.xlsx` local de respaldo (no toca Supabase).
- **Borrar** (botón): solo limpia la vista de tu navegador. Los datos
  siguen intactos en Supabase — recargá la página para volver a verlos.
- Como no hay login, cualquiera con el link puede ver **y cargar** datos.
  Si en algún momento eso deja de ser aceptable, se puede agregar
  Supabase Auth (login simple) sin rehacer el resto.

## Próximo paso: panel general de vehículos (GPS + Indicadores)

Cuando quieras integrar esto con el HTML del GPS (que va a seguir siendo
un archivo/página aparte):

1. Confirmame el nombre de la tabla/vista donde vive el reporte del GPS y
   qué columna identifica al vehículo ahí (idealmente `dominio`/patente).
2. Armamos una tercera página que traiga datos de ambas tablas
   (`gv_indicadores_mensuales` + la del GPS) y las cruce por `dominio`
   (posición actual del GPS + indicadores de gestión del mismo vehículo).

No hace falta tocar la tabla `gv_indicadores_mensuales` ni sus políticas
para eso — se puede leer en paralelo desde el mismo cliente de Supabase,
sin mezclar el HTML de un dashboard con el del otro.
