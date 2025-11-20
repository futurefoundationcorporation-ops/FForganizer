# Setup Final do Supabase - EXECUTAR AGORA

## ⚠️ IMPORTANTE: Execute este SQL no Supabase

Para que o painel admin funcione completamente (geração/listagem/exclusão de Access Keys), você precisa executar o SQL adicional no Supabase.

### Passo a Passo:

1. Acesse seu projeto Supabase: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. **Copie e cole o conteúdo do arquivo `SUPABASE_MASTER_KEY_FIX.sql`**
5. Clique em **RUN** para executar

### O que este SQL faz?

Cria 3 novas funções RPC que **confiam na validação** do backend:

- `create_access_key_with_validated_admin()` - Criar nova Access Key
- `list_access_keys_with_validated_admin()` - Listar todas as Access Keys
- `delete_access_key_with_validated_admin()` - Deletar uma Access Key

**Por quê isso é necessário?**

As funções antigas (`create_access_key`, `list_access_keys`, `delete_access_key`) tentavam validar a `admin_key` dentro do Supabase, mas a MASTER_KEY não está no banco de dados - ela é uma variável de ambiente do servidor.

As novas funções **confiam que o backend já validou a MASTER_KEY** antes de chamar as RPCs.

### Fluxo de Segurança:

1. ✅ Usuário faz login com MASTER_KEY
2. ✅ Backend valida MASTER_KEY contra `process.env.MASTER_KEY`
3. ✅ Backend cria sessão admin
4. ✅ Usuário acessa painel admin
5. ✅ Backend valida que sessão é admin
6. ✅ Backend chama RPC do Supabase **já validado**
7. ✅ Supabase executa operação (criar/listar/deletar Access Key)

---

## ✅ Após executar o SQL

O sistema estará **100% funcional**:

- ✅ Login com MASTER_KEY funcionando
- ✅ Sessão persistente funcionando
- ✅ Painel admin funcionando
- ✅ Geração de Access Keys funcionando
- ✅ Listagem de Access Keys funcionando
- ✅ Exclusão de Access Keys funcionando
- ✅ Login com Access Keys funcionando

---

## 🔐 MASTER_KEY Configurada

Sua MASTER_KEY atual:

```
MASTER-KEY-48efbfe2b48bcbdd89198058c653c9d2be3150c1ef05e91bd5036c3b641c310a168e64e89f113462994dfe712d99d2fb
```

**Use esta chave para fazer login como administrador!**

---

## 📋 Schema Original (Opcional)

Se você ainda não executou o schema completo do Supabase, execute primeiro o arquivo `SUPABASE_SCHEMA_SECURE_2025.sql` antes do fix.

Mas se já executou e tem a tabela `access_keys` funcionando, **execute apenas** o `SUPABASE_MASTER_KEY_FIX.sql`.
