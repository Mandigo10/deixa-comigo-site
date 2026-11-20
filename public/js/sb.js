// Conexão com o Supabase (usa a chave PÚBLICA definida em /config.js)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.DXCMG_CONFIG || {};

export const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
