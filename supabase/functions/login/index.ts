
// supabase/functions/login/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import crypto from 'https://deno.land/std@0.177.0/node/crypto.ts';

// Função de resposta padronizada para garantir CORS
function createJsonResponse(body: any, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function validateAccessKey(supabase: any, key: string): Promise<{ valid: boolean; isAdmin: boolean; source?: string; keyId?: string }> {
  const masterKey = Deno.env.get('MASTER_KEY') || '';
  const candidate = (key || '').trim();

  if (masterKey && candidate === masterKey) {
    return { valid: true, isAdmin: true, source: 'master' };
  }

  const { data: keys, error } = await supabase.from('access_keys').select('id, salt, key_hash, is_admin');
  if (error) {
    console.error('Erro ao buscar chaves de acesso:', error);
    return { valid: false, isAdmin: false };
  }

  for (const doc of keys) {
    const salt = doc.salt;
    const hash = crypto.createHash('sha256').update(candidate + salt).digest('hex');
    if (hash === doc.key_hash) {
      return { valid: true, isAdmin: !!doc.is_admin, source: 'access_key', keyId: doc.id };
    }
  }

  return { valid: false, isAdmin: false };
}

serve(async (req) => {
  // Responde imediatamente a preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return createJsonResponse({ error: 'Método não permitido' }, 405);
    }

    const { key } = await req.json();
    if (!key || typeof key !== 'string') {
      return createJsonResponse({ error: 'Chave inválida' }, 400);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const result = await validateAccessKey(supabaseClient, key);
    if (!result.valid) {
      return createJsonResponse({ error: 'Acesso negado' }, 403);
    }

    const isAdmin = !!result.isAdmin;
    const sessionToken = crypto.randomBytes(32).toString('hex');

    const { error: sessionError } = await supabaseClient.from('sessions').insert({
      session_token: sessionToken,
      is_admin: isAdmin,
    });

    if (sessionError) {
      console.error('Erro ao criar sessão:', sessionError);
      return createJsonResponse({ error: 'Erro ao criar sessão' }, 500);
    }

    return createJsonResponse({ success: true, token: sessionToken, isAdmin }, 200);

  } catch (err) {
    console.error('Erro na função de login:', err);
    return createJsonResponse({ error: 'Erro interno no servidor' }, 500);
  }
});
