-- ========================================
-- SUPABASE SESSIONS TABLE
-- Para sessões persistentes (Vercel-compatible)
-- ========================================

-- Tabela de sessões administrativas
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token text NOT NULL UNIQUE CHECK (char_length(session_token) >= 64),
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz DEFAULT now()
);

-- Índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON public.admin_sessions(expires_at);

-- Habilitar RLS
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas RPCs podem acessar (via SECURITY DEFINER)
CREATE POLICY "Block direct access to admin_sessions" ON public.admin_sessions
  FOR ALL USING (false);

-- ========================================
-- IMPORTANTE: Remover função antiga insegura
-- ========================================
-- Se existe função create_admin_session(text) da versão antiga,
-- ela DEVE ser removida pois permitia privilege escalation
DROP FUNCTION IF EXISTS public.create_admin_session(text);
REVOKE EXECUTE ON FUNCTION public.create_admin_session(text) FROM PUBLIC, anon, authenticated;

-- Função para criar sessão (chamada pelo serverless via service_role)
CREATE OR REPLACE FUNCTION public.create_admin_session(
  session_token text,
  user_is_admin boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_session_id uuid;
  expiration timestamptz;
BEGIN
  -- Sessão expira em 7 dias
  expiration := now() + interval '7 days';
  
  -- Inserir nova sessão com is_admin baseado no argumento
  INSERT INTO public.admin_sessions (session_token, is_admin, expires_at)
  VALUES (session_token, user_is_admin, expiration)
  RETURNING id INTO new_session_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'session_id', new_session_id,
    'expires_at', expiration,
    'is_admin', user_is_admin
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sessão já existe');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Erro ao criar sessão');
END;
$$;

-- Função para validar sessão
CREATE OR REPLACE FUNCTION public.validate_admin_session(session_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record RECORD;
BEGIN
  -- Buscar sessão
  SELECT id, is_admin, expires_at, created_at
  INTO session_record
  FROM public.admin_sessions
  WHERE admin_sessions.session_token = validate_admin_session.session_token
  LIMIT 1;
  
  -- Verificar se existe
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Sessão não encontrada');
  END IF;
  
  -- Verificar se expirou
  IF session_record.expires_at < now() THEN
    -- Deletar sessão expirada
    DELETE FROM public.admin_sessions WHERE id = session_record.id;
    RETURN jsonb_build_object('valid', false, 'error', 'Sessão expirada');
  END IF;
  
  -- Atualizar last_used_at
  UPDATE public.admin_sessions 
  SET last_used_at = now()
  WHERE id = session_record.id;
  
  -- Retornar sessão válida
  RETURN jsonb_build_object(
    'valid', true,
    'is_admin', session_record.is_admin,
    'session_id', session_record.id,
    'expires_at', session_record.expires_at
  );
END;
$$;

-- Função para deletar sessão (logout)
CREATE OR REPLACE FUNCTION public.delete_admin_session(session_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.admin_sessions WHERE admin_sessions.session_token = delete_admin_session.session_token;
  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Erro ao deletar sessão');
END;
$$;

-- Função para limpar sessões expiradas (executar periodicamente)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.admin_sessions WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', deleted_count
  );
END;
$$;

-- Grant permissions
-- IMPORTANTE: create_admin_session só pode ser chamado via service_role (backend)
-- Isso impede que usuários maliciosos criem sessões admin diretamente
-- REVOKE de PUBLIC é crítico para evitar privilege escalation
REVOKE ALL ON FUNCTION public.create_admin_session(text, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_admin_session(text, boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_admin_session(text, boolean) TO service_role;

-- Validação e deleção podem ser públicas (validam apenas sessões existentes)
GRANT EXECUTE ON FUNCTION public.validate_admin_session(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_admin_session(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_sessions() TO service_role;

-- ========================================
-- SCHEMA DE SESSÕES COMPLETO!
-- ========================================
-- ✅ Sessões persistentes no Supabase
-- ✅ Compatível com Vercel serverless
-- ✅ Auto-limpeza de sessões expiradas
-- ✅ RLS máximo - apenas RPCs acessam
-- ========================================
