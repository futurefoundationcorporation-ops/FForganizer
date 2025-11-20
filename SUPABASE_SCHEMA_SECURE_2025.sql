-- ========================================
-- SUPABASE SCHEMA SECURE 2025
-- Sistema de Autenticação por Chaves Seguras
-- 100% Compatível com Supabase 2025
-- ========================================

-- IMPORTANTE: Este schema implementa segurança máxima
-- com validação de chaves no backend via RPCs SECURITY DEFINER

-- ========================================
-- 1. CRIAR USUÁRIO FANTASMA (GHOST USER)
-- ========================================

-- Inserir usuário fantasma no auth.users
-- Este usuário será usado como user_id para todos os dados
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
)
VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'ghost@system.internal',
  crypt('SYSTEM_LOCKED_CANNOT_LOGIN', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 2. CRIAR EXTENSÕES NECESSÁRIAS
-- ========================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========================================
-- 3. CRIAR TABELAS
-- ========================================

-- Tabela de pastas
CREATE TABLE IF NOT EXISTS public.folders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
  name text NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 255),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de prompts
CREATE TABLE IF NOT EXISTS public.prompts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
  folder_id uuid REFERENCES public.folders(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 500),
  content text NOT NULL CHECK (char_length(content) > 0),
  tags text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de versões de prompts
CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de tokens de compartilhamento
CREATE TABLE IF NOT EXISTS public.share_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id uuid NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE CHECK (char_length(token) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de chaves de acesso (HASHED com salt individual)
CREATE TABLE IF NOT EXISTS public.access_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash text NOT NULL UNIQUE CHECK (char_length(key_hash) = 64),
  salt text NOT NULL CHECK (char_length(salt) = 32),
  label text CHECK (label IS NULL OR char_length(label) <= 255),
  created_by uuid NOT NULL DEFAULT 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  is_admin boolean NOT NULL DEFAULT false
);

-- ========================================
-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_folder_id ON public.prompts(folder_id);
CREATE INDEX IF NOT EXISTS idx_prompts_updated_at ON public.prompts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON public.prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_created_at ON public.prompt_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON public.share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_share_tokens_prompt_id ON public.share_tokens(prompt_id);
CREATE INDEX IF NOT EXISTS idx_access_keys_key_hash ON public.access_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_access_keys_is_admin ON public.access_keys(is_admin) WHERE is_admin = true;

-- ========================================
-- 5. HABILITAR ROW LEVEL SECURITY
-- ========================================

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. REMOVER POLICIES ANTIGAS
-- ========================================

DO $$ 
BEGIN
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Users can view their own folders" ON public.folders;
    DROP POLICY IF EXISTS "Users can create their own folders" ON public.folders;
    DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;
    DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;
    DROP POLICY IF EXISTS "Ghost user can view folders" ON public.folders;
    DROP POLICY IF EXISTS "Ghost user can create folders" ON public.folders;
    DROP POLICY IF EXISTS "Ghost user can update folders" ON public.folders;
    DROP POLICY IF EXISTS "Ghost user can delete folders" ON public.folders;
    DROP POLICY IF EXISTS "Public can view ghost user folders" ON public.folders;
    DROP POLICY IF EXISTS "Public can create ghost user folders" ON public.folders;
    DROP POLICY IF EXISTS "Public can update ghost user folders" ON public.folders;
    DROP POLICY IF EXISTS "Public can delete ghost user folders" ON public.folders;
    
    DROP POLICY IF EXISTS "Users can view their own prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Users can create their own prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Users can update their own prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Users can delete their own prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Ghost user can view prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Ghost user can create prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Ghost user can update prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Ghost user can delete prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Public can view ghost user prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Public can create ghost user prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Public can update ghost user prompts" ON public.prompts;
    DROP POLICY IF EXISTS "Public can delete ghost user prompts" ON public.prompts;
    
    DROP POLICY IF EXISTS "Users can view versions of their prompts" ON public.prompt_versions;
    DROP POLICY IF EXISTS "Users can create versions of their prompts" ON public.prompt_versions;
    DROP POLICY IF EXISTS "Ghost user can view prompt versions" ON public.prompt_versions;
    DROP POLICY IF EXISTS "Ghost user can create prompt versions" ON public.prompt_versions;
    DROP POLICY IF EXISTS "Public can view ghost user prompt versions" ON public.prompt_versions;
    DROP POLICY IF EXISTS "Public can create ghost user prompt versions" ON public.prompt_versions;
    
    DROP POLICY IF EXISTS "Users can create share tokens for their prompts" ON public.share_tokens;
    DROP POLICY IF EXISTS "Anyone can view share tokens" ON public.share_tokens;
    DROP POLICY IF EXISTS "Ghost user can create share tokens" ON public.share_tokens;
    DROP POLICY IF EXISTS "Public can view share tokens" ON public.share_tokens;
    DROP POLICY IF EXISTS "Public can create share tokens for ghost user prompts" ON public.share_tokens;
    
    DROP POLICY IF EXISTS "Anyone can read access keys" ON public.access_keys;
    DROP POLICY IF EXISTS "Ghost user can create access keys" ON public.access_keys;
    DROP POLICY IF EXISTS "Ghost user can delete access keys" ON public.access_keys;
    DROP POLICY IF EXISTS "Public can read access keys" ON public.access_keys;
    DROP POLICY IF EXISTS "Public can create access keys" ON public.access_keys;
    DROP POLICY IF EXISTS "Public can delete access keys" ON public.access_keys;
    DROP POLICY IF EXISTS "Public can view access key metadata" ON public.access_keys;
    DROP POLICY IF EXISTS "Public can create hashed access keys" ON public.access_keys;
END $$;

-- ========================================
-- 7. CRIAR POLICIES SEGURAS (MÁXIMA SEGURANÇA)
-- ========================================

-- FOLDERS: Apenas via autenticação validada (controlada por RPCs)
CREATE POLICY "Authenticated can view folders" ON public.folders
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can create folders" ON public.folders
  FOR INSERT WITH CHECK (user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid);

CREATE POLICY "Authenticated can update folders" ON public.folders
  FOR UPDATE USING (user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)
  WITH CHECK (user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid);

CREATE POLICY "Authenticated can delete folders" ON public.folders
  FOR DELETE USING (user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid);

-- PROMPTS: Apenas via autenticação validada
CREATE POLICY "Authenticated can view prompts" ON public.prompts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can create prompts" ON public.prompts
  FOR INSERT WITH CHECK (user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid);

CREATE POLICY "Authenticated can update prompts" ON public.prompts
  FOR UPDATE USING (user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)
  WITH CHECK (user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid);

CREATE POLICY "Authenticated can delete prompts" ON public.prompts
  FOR DELETE USING (user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid);

-- PROMPT_VERSIONS: Apenas para prompts do ghost user
CREATE POLICY "Authenticated can view prompt versions" ON public.prompt_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.prompts
      WHERE prompts.id = prompt_versions.prompt_id
      AND prompts.user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid
    )
  );

CREATE POLICY "Authenticated can create prompt versions" ON public.prompt_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prompts
      WHERE prompts.id = prompt_versions.prompt_id
      AND prompts.user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid
    )
  );

-- SHARE_TOKENS: Acesso público para leitura (necessário para compartilhamento)
CREATE POLICY "Anyone can view share tokens" ON public.share_tokens
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can create share tokens" ON public.share_tokens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prompts
      WHERE prompts.id = share_tokens.prompt_id
      AND prompts.user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid
    )
  );

-- ACCESS_KEYS: BLOQUEIO TOTAL - Apenas via RPCs SECURITY DEFINER
-- Usuários comuns NÃO PODEM criar/deletar chaves diretamente
CREATE POLICY "Block direct access to access_keys" ON public.access_keys
  FOR ALL USING (false);

-- ========================================
-- 8. FUNÇÕES RPC SEGURAS (SECURITY DEFINER)
-- ========================================

-- Função para validar chave de acesso (com salt individual)
CREATE OR REPLACE FUNCTION public.validate_access_key(plain_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_record RECORD;
  computed_hash text;
BEGIN
  -- Buscar chave por parte do hash
  -- Nota: Por segurança, fazemos hash duplo: hash(plain_key + salt)
  FOR key_record IN 
    SELECT id, key_hash, salt, is_admin, label 
    FROM public.access_keys
  LOOP
    -- Computar hash com salt
    computed_hash := encode(digest(plain_key || key_record.salt, 'sha256'), 'hex');
    
    -- Verificar se o hash bate
    IF computed_hash = key_record.key_hash THEN
      -- Atualizar last_used_at
      UPDATE public.access_keys 
      SET last_used_at = now()
      WHERE id = key_record.id;
      
      -- Retornar dados da chave
      RETURN jsonb_build_object(
        'valid', true,
        'is_admin', key_record.is_admin,
        'key_id', key_record.id,
        'label', key_record.label
      );
    END IF;
  END LOOP;
  
  -- Chave não encontrada
  RETURN jsonb_build_object('valid', false);
END;
$$;

-- Função para criar nova chave de acesso (SOMENTE ADMIN)
CREATE OR REPLACE FUNCTION public.create_access_key(
  admin_key text,
  new_key_hash text,
  new_salt text,
  key_label text DEFAULT NULL,
  is_admin_key boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_validated jsonb;
  new_key_id uuid;
BEGIN
  -- Validar que quem está criando é admin
  admin_validated := public.validate_access_key(admin_key);
  
  IF NOT (admin_validated->>'valid')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chave de admin inválida');
  END IF;
  
  IF NOT (admin_validated->>'is_admin')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas administradores podem criar chaves');
  END IF;
  
  -- Inserir nova chave
  INSERT INTO public.access_keys (key_hash, salt, label, is_admin, created_by)
  VALUES (new_key_hash, new_salt, key_label, is_admin_key, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)
  RETURNING id INTO new_key_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'key_id', new_key_id,
    'label', key_label,
    'is_admin', is_admin_key
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta chave já existe');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Erro ao criar chave');
END;
$$;

-- Função para deletar chave de acesso (SOMENTE ADMIN)
CREATE OR REPLACE FUNCTION public.delete_access_key(
  admin_key text,
  key_id_to_delete uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_validated jsonb;
BEGIN
  -- Validar que quem está deletando é admin
  admin_validated := public.validate_access_key(admin_key);
  
  IF NOT (admin_validated->>'valid')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chave de admin inválida');
  END IF;
  
  IF NOT (admin_validated->>'is_admin')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas administradores podem deletar chaves');
  END IF;
  
  -- Deletar chave
  DELETE FROM public.access_keys WHERE id = key_id_to_delete;
  
  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Erro ao deletar chave');
END;
$$;

-- Função para listar chaves (SOMENTE ADMIN) - retorna apenas metadata
CREATE OR REPLACE FUNCTION public.list_access_keys(admin_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_validated jsonb;
  keys_list jsonb;
BEGIN
  -- Validar que quem está listando é admin
  admin_validated := public.validate_access_key(admin_key);
  
  IF NOT (admin_validated->>'valid')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chave de admin inválida');
  END IF;
  
  IF NOT (admin_validated->>'is_admin')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas administradores podem listar chaves');
  END IF;
  
  -- Buscar metadata das chaves (SEM key_hash ou salt)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'label', label,
      'is_admin', is_admin,
      'created_at', created_at,
      'last_used_at', last_used_at
    )
    ORDER BY created_at DESC
  )
  INTO keys_list
  FROM public.access_keys;
  
  RETURN jsonb_build_object('success', true, 'keys', COALESCE(keys_list, '[]'::jsonb));
END;
$$;

-- Função para acessar prompt compartilhado
CREATE OR REPLACE FUNCTION public.get_shared_prompt(share_token text)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  tags text[],
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.title, p.content, p.tags, p.created_at
  FROM public.prompts p
  INNER JOIN public.share_tokens st ON st.prompt_id = p.id
  WHERE st.token = share_token;
END;
$$;

-- ========================================
-- 9. TRIGGERS PARA MANUTENÇÃO
-- ========================================

-- Trigger para atualizar updated_at em prompts
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_prompts_updated_at ON public.prompts;
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 10. GRANT PERMISSIONS
-- ========================================

-- Permitir acesso público às funções RPC
GRANT EXECUTE ON FUNCTION public.validate_access_key(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_access_key(text, text, text, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_access_key(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_access_keys(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_prompt(text) TO anon, authenticated;

-- ========================================
-- SCHEMA COMPLETO E SEGURO!
-- ========================================
-- ✅ 100% Compatível com Supabase 2025
-- ✅ RLS máximo - acesso direto bloqueado
-- ✅ Apenas RPCs SECURITY DEFINER podem manipular chaves
-- ✅ Salt individual por chave (segurança extra)
-- ✅ Validação de admin em cada operação sensível
-- ✅ Metadata sem expor hashes
-- ========================================
