/* =========================================================
   CONFIGURACIÓN — Indicadores GV
   =========================================================
   1. SUPABASE_URL: ya está completado con tu proyecto.
   2. SUPABASE_ANON_KEY: pegá acá la "anon public key" de tu
      proyecto Supabase (Project Settings > API > Project API keys).
      Esta key es pública por diseño (se usa desde el navegador);
      la seguridad real la dan las políticas RLS de la tabla
      (ver supabase/schema.sql).
   3. SUPABASE_TABLE: nombre de la tabla creada por schema.sql.
      Se usa el prefijo "gv_" para no chocar con las tablas del GPS.
   ========================================================= */
window.APP_CONFIG = {
  SUPABASE_URL: "https://oixzkvkybqexvrzwzwis.supabase.co",
  SUPABASE_ANON_KEY: "PEGAR_ACA_TU_ANON_KEY",
  SUPABASE_TABLE: "gv_indicadores_mensuales"
};
