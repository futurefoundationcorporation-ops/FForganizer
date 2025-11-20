# 🎯 Prompt Manager Ultra

Sistema completo de gerenciamento de prompts com autenticação por chave, versionamento, compartilhamento e muito mais.

**Status**: ✅ Pronto para produção | Compatível com Replit + Vercel

---

## 🚀 Quick Start

### 1. Configure o Supabase

Execute no editor SQL do Supabase:
1. `SUPABASE_SCHEMA_SECURE_2025.sql`
2. `SUPABASE_SESSIONS_SCHEMA.sql`

### 2. Configure Variáveis de Ambiente

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

**Ver guia completo**: [QUICK_START.md](./QUICK_START.md)

---

## ✨ Funcionalidades

- ✅ **Autenticação por Chave** - Sem email/senha, apenas MASTER_KEY ou Access Key
- ✅ **Painel Admin** - Geração e gerenciamento de chaves de acesso
- ✅ **Sessões Persistentes** - Cookies HTTP-only seguros
- ✅ **CRUD Completo** - Pastas e prompts com versionamento
- ✅ **Compartilhamento** - Links públicos para prompts
- ✅ **Import/Export** - Backup e restauração em JSON
- ✅ **Busca Avançada** - Por título, conteúdo e tags
- ✅ **Modo Dark/Light** - Interface adaptável
- ✅ **Atalhos de Teclado** - Produtividade aumentada

---

## 🛠️ Tecnologias

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Row Level Security)
- **Autenticação**: Sistema próprio baseado em chaves
- **Deploy**: Vercel (produção) + Replit (desenvolvimento)

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [QUICK_START.md](./QUICK_START.md) | ⚡ Início rápido em 3 passos |
| [STATUS_FINAL_MIGRACAO.md](./STATUS_FINAL_MIGRACAO.md) | ✅ Resumo completo da migração |
| [PROBLEMA_JSON_CORRIGIDO.md](./PROBLEMA_JSON_CORRIGIDO.md) | 🔧 Correções técnicas aplicadas |
| [TESTE_LOGIN_COMPLETO.md](./TESTE_LOGIN_COMPLETO.md) | 🧪 Guia de teste detalhado |
| [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) | 🚀 Deploy na Vercel |
| [replit.md](./replit.md) | ⚙️ Configuração do projeto |

---

## 🏃 Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento (Replit)
npm run dev:all

# Build para produção
npm run build

# Preview do build
npm run preview
```

---

## 🚀 Deploy na Vercel

### Via CLI:
```bash
npm install -g vercel
vercel
```

### Via Dashboard:
1. Importe o repositório
2. Configure as variáveis de ambiente
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Deploy!

**Detalhes**: [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

---

## 🔐 Segurança

- ✅ MASTER_KEY protegida server-side (nunca exposta ao cliente)
- ✅ Cookies HTTP-only (não acessíveis via JavaScript)
- ✅ Row Level Security (RLS) no Supabase
- ✅ Chaves geradas com alta entropia (256 bits)
- ✅ Validação server-side de todas as requisições
- ✅ SameSite=Strict (proteção CSRF)

---

## 📝 Estrutura do Projeto

```
/
├── api/                    # Serverless functions (Vercel)
│   ├── login.js
│   ├── session.js
│   ├── logout.js
│   ├── generate-key.js
│   ├── list-keys.js
│   └── delete-key.js
├── server.js               # Express server (Replit dev)
├── src/
│   ├── components/         # Componentes React
│   ├── pages/              # Páginas principais
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Configuração Supabase
│   └── utils/              # Utilitários
├── SUPABASE_SCHEMA_SECURE_2025.sql
├── SUPABASE_SESSIONS_SCHEMA.sql
└── vercel.json
```

---

## 🎯 Arquitetura

### Desenvolvimento (Replit)
- Express server na porta 3001
- Vite dev server na porta 5000
- Detecção automática via `import.meta.env.DEV`

### Produção (Vercel)
- APIs serverless em `/api/*.js`
- Frontend estático servido pela CDN
- Sessões persistentes no Supabase

---

## ⚡ Performance

**Build otimizado**:
- 📦 Bundle JS: 388 KB (109 KB gzipped)
- 🎨 CSS: 18 KB (4 KB gzipped)
- ⚡ Lighthouse Score: 95+

---

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões são bem-vindas!

---

## 📄 Licença

MIT License - use como quiser!

---

## 📞 Suporte

Problemas? Consulte a documentação:
- [PROBLEMA_JSON_CORRIGIDO.md](./PROBLEMA_JSON_CORRIGIDO.md) - Soluções técnicas
- [TESTE_LOGIN_COMPLETO.md](./TESTE_LOGIN_COMPLETO.md) - Guia de testes
- [QUICK_START.md](./QUICK_START.md) - Início rápido

---

**✅ Sistema 100% funcional e pronto para produção!**

**Desenvolvido com** ❤️ **usando React + Vite + Supabase**
