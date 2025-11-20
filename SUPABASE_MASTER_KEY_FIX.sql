-- ========================================
-- FIX: Adicionar suporte para MASTER_KEY nas RPCs
-- ========================================

-- Esta função valida a MASTER_KEY comparando com uma variável de ambiente
-- ou usa a validação normal de access_key do banco
CREATE OR REPLACE FUNCTION public.validate_master_or_access_key(
  input_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  master_key_env text;
  result jsonb;
  key_record record;
  computed_hash text;
BEGIN
  -- Nota: Como Supabase não permite ler env vars diretamente,
  -- a MASTER_KEY deve ser validada no backend (Node.js)
  -- Esta função apenas valida access_keys do banco de dados
  
  -- Validar se é access key do banco
  SELECT key_hash, salt, is_admin, id
  INTO key_record
  FROM public.access_keys
  WHERE key_hash = encode(digest(input_key || salt, 'sha256'), 'hex')
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Chave não encontrada no banco. Use MASTER_KEY via backend.'
    );
  END IF;
  
  -- Atualizar último uso
  UPDATE public.access_keys
  SET last_used_at = now()
  WHERE id = key_record.id;
  
  RETURN jsonb_build_object(
    'valid', true,
    'is_admin', key_record.is_admin,
    'key_id', key_record.id
  );
END;
$$;

-- Atualizar create_access_key para aceitar flag indicando que admin_key já foi validada
CREATE OR REPLACE FUNCTION public.create_access_key_with_validated_admin(
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
  new_key_id uuid;
BEGIN
  -- Esta função assume que o backend já validou a MASTER_KEY
  -- Não faz validação adicional (confia no backend)
  
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
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Atualizar list_access_keys para aceitar flag de admin validado
CREATE OR REPLACE FUNCTION public.list_access_keys_with_validated_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  keys_array jsonb;
BEGIN
  -- Esta função assume que o backend já validou a MASTER_KEY
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'label', label,
      'is_admin', is_admin,
      'created_at', created_at,
      'last_used_at', last_used_at
    )
  )
  INTO keys_array
  FROM public.access_keys
  ORDER BY created_at DESC;
  
  RETURN jsonb_build_object(
    'success', true,
    'keys', COALESCE(keys_array, '[]'::jsonb)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Atualizar delete_access_key para aceitar flag de admin validado
CREATE OR REPLACE FUNCTION public.delete_access_key_with_validated_admin(
  key_id_to_delete uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Esta função assume que o backend já validou a MASTER_KEY
  
  DELETE FROM public.access_keys
  WHERE id = key_id_to_delete;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chave não encontrada');
  END IF;
  
  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.validate_master_or_access_key(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_access_key_with_validated_admin(text, text, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_access_keys_with_validated_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_access_key_with_validated_admin(uuid) TO anon, authenticated;

-- ========================================
-- INSTRUÇÕES DE USO:
-- ========================================
-- Execute este SQL no Supabase SQL Editor
-- Isso criará funções que confiam na validação do backend
-- O backend valida MASTER_KEY antes de chamar essas funções
-- ========================================
