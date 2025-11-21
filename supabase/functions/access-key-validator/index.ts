import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validador de chave de acesso que executa na borda.
// Intercepta pedidos, exige uma chave 'x-api-key' válida e ativa.
Deno.serve(async (req) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response('Configuração de ambiente do Supabase ausente.', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const apiKey = req.headers.get('x-api-key');

  if (!apiKey) {
    return new Response('Chave de API ausente.', { status: 401 });
  }

  const { data, error } = await supabase
    .from('access_keys')
    .select('id, is_revoked')
    .eq('key', apiKey)
    .single();

  if (error || !data || data.is_revoked) {
    return new Response('Chave de API inválida ou revogada.', { status: 401 });
  }

  // Se a chave for válida, o pedido pode prosseguir.
  // O Deno.serve do Supabase passará o controle para a próxima função ou para a API do PostgREST.
  return new Response(null, {
    headers: { 'x-supabase-edge-function-response': 'true' },
  });
});
