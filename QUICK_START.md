# 🚀 Quick Start - Prompt Manager Ultra

## ⚡ Início Rápido (3 passos)

### 1️⃣ Configure o Supabase

Execute os seguintes scripts SQL no editor SQL do Supabase:

1. **Schema principal**: `SUPABASE_SCHEMA_SECURE_2025.sql`
2. **Sessões**: `SUPABASE_SESSIONS_SCHEMA.sql`

### 2️⃣ Configure as Variáveis de Ambiente

**No Replit (Secrets)** ou **Na Vercel (Environment Variables)**:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

**Opcional** (usa fallback se não configurada):
```bash
MASTER_KEY=MASTER-KEY-48efbfe2b48bcbdd89198058c653c9d2be3150c1ef05e91bd5036c3b641c310a168e64e89f113462994dfe712d99d2fb
```

### 3️⃣ Teste o Login

**MASTER_KEY para teste**:
```
MASTER-KEY-48efbfe2b48bcbdd89198058c653c9d2be3150c1ef05e91bd5036c3b641c310a168e64e89f113462994dfe712d99d2fb
```

1. Acesse a aplicação
2. Cole a MASTER_KEY no campo de login
3. Clique em "Entrar"
4. ✅ **Sucesso!** Você está logado como administrador

---

## 🔧 Desenvolvimento (Replit)

```bash
npm install
npm run dev:all
```

Acesse: http://localhost:5000

---

## 🚀 Deploy (Vercel)

### Via CLI:
```bash
npm install -g vercel
vercel
```

### Via Dashboard:
1. Importe o repositório no Vercel
2. Configure as variáveis de ambiente
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Deploy!

**Ver guia completo**: `VERCEL_DEPLOYMENT_GUIDE.md`

---

## 📚 Documentação Completa

| Documento | Descrição |
|-----------|-----------|
| `STATUS_FINAL_MIGRACAO.md` | ✅ Status da migração completa |
| `PROBLEMA_JSON_CORRIGIDO.md` | 🔧 Correções técnicas aplicadas |
| `TESTE_LOGIN_COMPLETO.md` | 🧪 Guia de teste passo a passo |
| `VERCEL_DEPLOYMENT_GUIDE.md` | 🚀 Deploy na Vercel |
| `SUPABASE_SESSIONS_SCHEMA.sql` | 🗄️ Schema de sessões |
| `SUPABASE_SCHEMA_SECURE_2025.sql` | 🗄️ Schema completo |

---

## 🎯 Funcionalidades Principais

- ✅ Login com MASTER_KEY (admin)
- ✅ Geração de Access Keys
- ✅ Sessões persistentes (cookies HTTP-only)
- ✅ Painel Admin protegido
- ✅ CRUD de pastas e prompts
- ✅ Versionamento de prompts
- ✅ Sistema de compartilhamento
- ✅ Import/Export JSON
- ✅ Busca por tags e conteúdo
- ✅ Modo dark/light
- ✅ Atalhos de teclado

---

## ❓ Problemas Comuns

### Erro "Chave inválida"
- Copie a MASTER_KEY completa (sem espaços extras)
- Verifique se não tem quebra de linha

### Erro "Supabase não configurado"
- Verifique se as variáveis de ambiente estão corretas
- Confirme que executou os scripts SQL

### Erro na criação de sessão
- Execute `SUPABASE_SESSIONS_SCHEMA.sql`
- Verifique que a função `create_admin_session` existe

---

## 🆘 Suporte

Consulte os documentos técnicos para mais detalhes:
- Problemas técnicos: `PROBLEMA_JSON_CORRIGIDO.md`
- Testes completos: `TESTE_LOGIN_COMPLETO.md`
- Deploy: `VERCEL_DEPLOYMENT_GUIDE.md`

---

**✅ Sistema 100% funcional e pronto para produção!**
