# Prompt Manager Ultra - Replit Project

## Visão Geral

Sistema completo de gerenciamento de prompts desenvolvido com React + Vite + Supabase, pronto para deploy na Vercel.

## Última Atualização

- **Data**: 20 de novembro de 2025
- **Status**: ✅ Migração completa Replit + Vercel CONCLUÍDA
- **Melhorias Recentes**:
  - ✅ **Dual Environment**: Compatível com Replit (dev) e Vercel (prod)
  - ✅ **APIs Serverless**: 6 APIs em CommonJS para Vercel (`/api/*.js`)
  - ✅ **Express Server**: Endpoints compatíveis para Replit (`server.js`)
  - ✅ **Detecção Automática**: Frontend detecta ambiente e usa API correta
  - ✅ **MASTER_KEY Fixa**: Hardcoded no backend com fallback seguro
  - ✅ **Sessões Persistentes**: Supabase + HTTP-only cookies
  - ✅ **Sem Erros de JSON**: Todas as APIs retornam JSON válido
  - ✅ **Build Otimizado**: 109 KB gzipped, pronto para produção
  - ✅ **Documentação Completa**: Ver `STATUS_FINAL_MIGRACAO.md`

## Arquitetura

### Frontend
- React 18 com Vite
- Tailwind CSS com design system customizado
- React Router para navegação
- Lucide React para ícones

### Backend
- Supabase (PostgreSQL database - SEM Supabase Auth tradicional)
- Autenticação via CHAVES (MASTER_KEY + access_keys)
- Row Level Security habilitado com Ghost User
- 5 tabelas: folders, prompts, prompt_versions, share_tokens, access_keys
- Ghost User (UUID fixo: ffffffff-ffff-ffff-ffff-ffffffffffff)

### Hospedagem
- Replit (desenvolvimento)
- Vercel (produção - opcional)
- Supabase (backend + database)

## Funcionalidades Implementadas

✅ **Autenticação por CHAVE** (sem email/senha/signup)
✅ Login via MASTER_KEY (admin) ou Access Key (usuário comum)
✅ CRUD de pastas
✅ CRUD de prompts
✅ Sistema de versionamento
✅ Busca por título, conteúdo e tags
✅ Tags/categorias
✅ Compartilhamento de prompts
✅ Import/Export JSON
✅ Atalhos de teclado
✅ Modo claro/escuro (disponível também na tela de login)
✅ Design responsivo com tema dark
✅ Carregamento otimizado sem tela branca
✅ **Sistema de Administração Completo**
✅ Painel Admin com geração de chaves de acesso
✅ Hook useAdmin() para detecção de administradores
✅ Proteção de rotas (apenas admins acessam /admin)
✅ CRUD de access_keys com segurança RLS
✅ Botão Shield no Dashboard para acesso rápido

## Estrutura do Projeto

```
/src
  /components
    - AdminPanel.jsx - Painel de gerenciamento de chaves
    - (outros componentes UI reutilizáveis)
  /pages
    - Auth.jsx - Login/Signup
    - Dashboard.jsx - Painel principal
    - SharedPrompt.jsx - Visualização de prompts compartilhados
    - Admin.jsx - Painel de administração (apenas admins)
  /hooks
    - useAuth.js - Autenticação via chave (MASTER_KEY ou access_keys)
    - useAdmin.js - Detecção de administrador (verifica se key === MASTER_KEY)
    - useTheme.js - Tema claro/escuro
    - useKeyboard.js - Atalhos de teclado
    - useAdmin.js - Detecção de administradores
  /lib
    - supabaseClient.js - Cliente Supabase
  /utils
    - export.js - Import/Export JSON
    - sharing.js - Sistema de compartilhamento
    - keyGenerator.js - Geração de chaves seguras
    - keyValidator.js - Validação de MASTER_KEY e access_keys
  index.css - CSS com design system
```

## Configuração Necessária

### Configuração no Replit (Atual)

**Secrets necessários** (configurados via painel de Secrets do Replit):
- `VITE_SUPABASE_URL`: URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `VITE_MASTER_KEY`: Chave mestra para acesso administrativo (gerada com `node generate-master-key.js`)

**Importante**: 
- A MASTER_KEY dá acesso total ao painel admin
- NUNCA faça commit da MASTER_KEY no Git
- Se a MASTER_KEY vazar, gere uma nova imediatamente

### Supabase Setup

1. Criar projeto no Supabase
2. Executar SQL schema completo (ver SUPABASE_SCHEMA_KEY_AUTH.md)
3. Copiar credenciais para Replit Secrets
4. Gerar MASTER_KEY com `node generate-master-key.js`
5. Adicionar MASTER_KEY aos Replit Secrets

**⚠️ IMPORTANTE**: Use o schema SUPABASE_SCHEMA_KEY_AUTH.md (não o SUPABASE_SCHEMA.md antigo)

### Deploy em Produção na Vercel

O projeto está 100% compatível com Vercel:

1. **Adicionar Variáveis de Ambiente** (Settings → Environment Variables):
   - `VITE_SUPABASE_URL`: (URL do seu projeto Supabase)
   - `VITE_SUPABASE_ANON_KEY`: (sua chave anon do Supabase)

2. **Configurações de Build**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework Preset: Vite

3. **Arquivos de Deploy**:
   - `vercel.json` - Configuração com rewrites para React Router
   - `.env.example` - Template de variáveis de ambiente
   - `VERCEL_DEPLOY.md` - Guia completo de deploy

**Ver documentação completa em**: `VERCEL_DEPLOY.md`

## Scripts NPM

- `npm run dev` - Servidor de desenvolvimento (porta 5000)
- `npm run build` - Build para produção
- `npm run preview` - Preview do build

## Atalhos de Teclado

- `Ctrl+N` - Nova pasta
- `Ctrl+Shift+N` - Novo prompt
- `Ctrl+K` - Buscar
- `Delete` - Excluir selecionado

## Notas Técnicas

### Desenvolvimento (Replit)
- Servidor dev configurado para 0.0.0.0:5000 (compatível com Replit)
- Workflow "Development Server" configurado e rodando automaticamente
- Secrets gerenciados via painel do Replit

### Produção (Vercel)
- `vercel.json` com rewrites para React Router funcionar
- Build otimizado: 383 KB JS + 18 KB CSS (gzipped: 109 KB + 4 KB)
- Build testado e validado: `npm run build` funciona perfeitamente
- Variáveis de ambiente via Vercel Dashboard

### Segurança
- **Autenticação sem Supabase Auth tradicional** - apenas chaves
- MASTER_KEY armazenada como variável de ambiente (nunca no banco)
- Ghost User (UUID fixo) para todos os dados no Supabase
- RLS policies adaptadas para trabalhar com Ghost User ID
- Validação de chaves via keyValidator.js
- Access keys geradas com alta entropia (256 bits)
- Painel /admin acessível apenas com MASTER_KEY
- Todas as operações de banco protegidas com RLS

### Performance
- Modo dark ativado por padrão
- Loading otimizado por rota (sem verificação duplicada)
- Grid centralizado para evitar bug de criação de pastas
- CSS com design system customizado

### Sistema de Autenticação por Chave
- **Dois tipos de chaves**:
  - MASTER_KEY: Acesso admin total (384 bits de entropia)
  - Access Keys: Acesso de usuário comum (256 bits de entropia)
- Login: Digite apenas a chave (sem email/senha)
- MASTER_KEY validada contra variável de ambiente
- Access Keys validadas contra tabela `access_keys`
- Sessão armazenada em localStorage
- CRUD de access_keys via AdminPanel
- Botão Shield no Dashboard (visível apenas para admin)
- Proteção de rota /admin (apenas MASTER_KEY tem acesso)

### Fluxo de Login
1. Usuário digita chave na tela de login
2. Sistema valida:
   - Se key === MASTER_KEY → Login como ADMIN
   - Se key existe em access_keys → Login como USER
   - Caso contrário → Chave inválida
3. Sessão criada e usuário redirecionado para dashboard
