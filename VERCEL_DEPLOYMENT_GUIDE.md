# 🚀 Guia de Deploy na Vercel - Prompt Manager Ultra

## 📋 Visão Geral

Este projeto foi migrado para arquitetura **100% serverless** compatível com Vercel:

✅ **Frontend**: Vite + React (Static Site)
✅ **Backend**: Vercel Serverless Functions (Node.js)
✅ **Database**: Supabase (PostgreSQL)
✅ **Sessions**: Persistentes no Supabase (não mais em memória)
✅ **Authentication**: Cookies HTTP-only + MASTER_KEY server-side

---

## 🔐 Segurança Implementada

### ✅ Proteção Total da MASTER_KEY
- **NUNCA** exposta no frontend ou bundle
- Validada **apenas** no backend (serverless functions)
- Armazenada como variável de ambiente da Vercel

### ✅ Sessões Persistentes
- Sessões armazenadas no Supabase (tabela `admin_sessions`)
- Expiração automática em 7 dias
- Cookies HTTP-only, Secure, SameSite=Strict

### ✅ Access Keys com Hash + Salt
- Cada chave tem salt individual
- Hash SHA-256 + salt armazenado no Supabase
- Validação via RPC functions (SECURITY DEFINER)

### ✅ RLS (Row Level Security)
- Acesso direto a `access_keys` e `admin_sessions` bloqueado
- Apenas RPCs SECURITY DEFINER podem manipular dados sensíveis

---

## 📝 Passo a Passo - Deploy na Vercel

### 1️⃣ Configurar Supabase

Acesse seu projeto Supabase e execute os SQLs **na ordem**:

#### A) Schema Principal
Execute o arquivo `SUPABASE_SCHEMA_SECURE_2025.sql` completo no SQL Editor do Supabase.

#### B) Schema de Sessões
Execute o arquivo `SUPABASE_SESSIONS_SCHEMA.sql` completo no SQL Editor do Supabase.

**Resultado esperado:**
- Tabelas: `folders`, `prompts`, `prompt_versions`, `share_tokens`, `access_keys`, `admin_sessions`
- RPCs: `validate_access_key`, `create_access_key`, `delete_access_key`, `list_access_keys`, `create_admin_session`, `validate_admin_session`, `delete_admin_session`
- Policies RLS ativas

---

### 2️⃣ Obter Credenciais do Supabase

No painel do Supabase:

1. Vá em **Settings** → **API**
2. Copie as seguintes informações:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (⚠️ mantenha secreto!)

---

### 3️⃣ Gerar MASTER_KEY

Opção 1 - Usar o gerador incluído:
```bash
node generate-master-key.js
```

Opção 2 - Gerar manualmente:
```bash
openssl rand -hex 32
```

**IMPORTANTE**: Guarde esta chave com segurança! Ela dá acesso total como administrador.

---

### 4️⃣ Fazer Deploy na Vercel

#### A) Via GitHub (Recomendado)

1. Faça push do projeto para o GitHub:
```bash
git add .
git commit -m "Projeto pronto para Vercel"
git push origin main
```

2. Acesse [vercel.com](https://vercel.com)
3. Clique em **"New Project"**
4. Importe o repositório do GitHub
5. Vercel detectará automaticamente como projeto Vite

#### B) Via Vercel CLI

```bash
npm install -g vercel
vercel
```

---

### 5️⃣ Configurar Variáveis de Ambiente na Vercel

No painel da Vercel:

1. Vá em **Settings** → **Environment Variables**
2. Adicione as seguintes variáveis (para **Production**, **Preview** e **Development**):

| Nome da Variável | Valor | Descrição |
|------------------|-------|-----------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Chave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Chave privada (⚠️ NÃO usar VITE_) |
| `MASTER_KEY` | `<sua-master-key>` | Chave mestra admin (⚠️ NÃO usar VITE_) |

**⚠️ ATENÇÃO:**
- Variáveis com `VITE_` são **públicas** (vão para o bundle frontend)
- Variáveis **sem** `VITE_` são **privadas** (apenas backend)
- **NUNCA** use `VITE_` para `MASTER_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`

---

### 6️⃣ Re-deploy após Configurar Variáveis

Após adicionar as variáveis de ambiente:

1. Vá em **Deployments**
2. Clique nos **três pontos** no último deployment
3. Clique em **"Redeploy"**
4. Marque **"Use existing Build Cache"** (opcional)
5. Clique em **"Redeploy"**

---

## ✅ Checklist Final

Antes de considerar o deploy completo, verifique:

### Database (Supabase)
- [ ] `SUPABASE_SCHEMA_SECURE_2025.sql` executado com sucesso
- [ ] `SUPABASE_SESSIONS_SCHEMA.sql` executado com sucesso
- [ ] Tabelas criadas: `folders`, `prompts`, `prompt_versions`, `share_tokens`, `access_keys`, `admin_sessions`
- [ ] RPCs criadas e funcionando
- [ ] RLS ativado em todas as tabelas

### Vercel Environment Variables
- [ ] `VITE_SUPABASE_URL` configurado
- [ ] `VITE_SUPABASE_ANON_KEY` configurado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado (SEM `VITE_`)
- [ ] `MASTER_KEY` configurado (SEM `VITE_`)
- [ ] Todas as variáveis adicionadas em Production, Preview e Development

### Deploy
- [ ] Build executado sem erros
- [ ] Site acessível via URL da Vercel
- [ ] Nenhum erro 500 nas serverless functions

### Testes de Funcionalidade
- [ ] Login com MASTER_KEY funciona
- [ ] Acesso ao painel `/admin` funciona
- [ ] Gerar nova chave de acesso funciona
- [ ] Listar chaves funciona
- [ ] Deletar chave funciona
- [ ] Logout funciona
- [ ] Login com Access Key funciona
- [ ] Sessão persiste após reload da página

---

## 🧪 Como Testar

### 1. Testar Login como Admin

1. Acesse seu site na Vercel
2. Faça login com a `MASTER_KEY`
3. Deve redirecionar para o Dashboard
4. Clique em "Admin" no menu
5. Deve abrir o Painel de Administração

### 2. Testar Geração de Chaves

1. No painel admin, clique em "Gerar Nova Chave"
2. Digite um rótulo (opcional)
3. Clique em "Gerar Chave"
4. Copie a chave gerada (será exibida apenas 1x)
5. Chave deve aparecer na lista

### 3. Testar Login com Access Key

1. Faça logout
2. Faça login com a Access Key gerada
3. Deve funcionar normalmente
4. Painel admin deve estar bloqueado (403)

### 4. Testar Persistência de Sessão

1. Faça login
2. Feche e abra o navegador
3. Acesse o site novamente
4. Deve permanecer logado

---

## 📂 Estrutura de Arquivos

```
/
├── api/                          # Vercel Serverless Functions
│   ├── login.js                  # POST /api/login - Autenticação
│   ├── session.js                # GET /api/session - Validar sessão
│   ├── logout.js                 # POST /api/logout - Encerrar sessão
│   ├── generate-key.js           # POST /api/generate-key - Criar chave (admin)
│   ├── list-keys.js              # GET /api/list-keys - Listar chaves (admin)
│   └── delete-key.js             # POST /api/delete-key - Deletar chave (admin)
│
├── src/                          # Frontend React
│   ├── components/
│   │   └── AdminPanel.jsx        # Painel de administração
│   ├── hooks/
│   │   ├── useAuth.js            # Hook de autenticação (atualizado)
│   │   └── useAdmin.js           # Hook de verificação admin
│   ├── utils/
│   │   └── authApi.js            # API client para serverless functions
│   └── ...
│
├── SUPABASE_SCHEMA_SECURE_2025.sql    # Schema principal do banco
├── SUPABASE_SESSIONS_SCHEMA.sql       # Schema de sessões
├── vercel.json                        # Configuração da Vercel
├── package.json
└── README.md
```

---

## 🔧 Arquivos Importantes

### `api/login.js`
- Valida MASTER_KEY ou Access Key
- Cria sessão no Supabase
- Define cookies HTTP-only

### `api/session.js`
- Lê cookie da requisição
- Valida sessão no Supabase
- Retorna status da sessão

### `api/generate-key.js`
- Verifica se é admin
- Gera chave aleatória
- Cria hash com salt
- Armazena no Supabase via RPC
- Retorna chave apenas 1x

### `src/utils/authApi.js`
- Client-side API para chamar serverless functions
- Gerencia cookies automaticamente
- Funções: `loginWithKey()`, `getSession()`, `logout()`, etc.

### `src/hooks/useAuth.js`
- Hook React para gerenciar autenticação
- Valida sessão ao carregar app
- Fornece `signIn()` e `signOut()`

---

## 🐛 Troubleshooting

### Erro: "MASTER_KEY não configurada"
**Solução**: Adicione `MASTER_KEY` nas variáveis de ambiente da Vercel (sem `VITE_`)

### Erro: "Supabase não configurado"
**Solução**: Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretos

### Erro 500 nas APIs
**Solução**: 
1. Veja os logs em Vercel Dashboard → Functions
2. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurado
3. Verifique se os SQLs foram executados corretamente

### Sessão não persiste
**Solução**:
1. Verifique se `admin_sessions` table foi criada
2. Verifique se RPC `create_admin_session` existe
3. Limpe cookies do navegador e tente novamente

### Access Key não funciona
**Solução**:
1. Verifique se `access_keys` table foi criada
2. Verifique se RPC `validate_access_key` existe
3. Gere uma nova chave no painel admin

---

## 📚 Diferenças entre Replit e Vercel

| Aspecto | Replit | Vercel |
|---------|--------|--------|
| **Backend** | Express persistente (porta 3001) | Serverless Functions |
| **Sessões** | Memória (Map) | Supabase (persistente) |
| **Autenticação** | Fetch para localhost:3001 | Fetch para /api/* |
| **Cookies** | Gerenciados manualmente | Automático via Vercel |
| **Escalabilidade** | 1 instância | Auto-scaling |

---

## 🎯 Próximos Passos

Após deploy bem-sucedido:

1. **Configurar domínio customizado** (opcional)
   - Vercel Dashboard → Settings → Domains
   
2. **Habilitar Analytics** (opcional)
   - Vercel Dashboard → Analytics
   
3. **Configurar Proteção contra DDoS** (opcional)
   - Vercel Dashboard → Security

4. **Backup do Supabase** (recomendado)
   - Configurar backups automáticos no Supabase

---

## 🔒 Segurança em Produção

### ✅ O que está protegido:

- ✅ MASTER_KEY nunca exposta no cliente
- ✅ Cookies HTTP-only (não acessíveis via JavaScript)
- ✅ Cookies Secure (apenas HTTPS)
- ✅ Cookies SameSite=Strict (proteção CSRF)
- ✅ Access Keys com hash + salt individual
- ✅ RLS bloqueando acesso direto às tabelas
- ✅ Apenas RPCs SECURITY DEFINER podem manipular dados sensíveis
- ✅ Sessões com expiração automática
- ✅ Service Role Key apenas no backend

### ⚠️ Recomendações adicionais:

1. Use HTTPS sempre (Vercel fornece automaticamente)
2. Rotacione MASTER_KEY periodicamente
3. Monitore logs de autenticação
4. Configure rate limiting se necessário
5. Ative 2FA no Supabase e Vercel

---

## 📞 Suporte

Problemas? Verifique:
1. Logs da Vercel (Dashboard → Functions → Logs)
2. Console do navegador (F12)
3. SQL Editor do Supabase (verificar se RPCs existem)
4. Variáveis de ambiente (Vercel → Settings → Environment Variables)

---

**✅ Projeto 100% pronto para produção na Vercel!**
