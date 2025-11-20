# Prompt Manager Ultra — Firebase

Sistema de gerenciamento de prompts com autenticação por chave, sessão permanente, hierarquia de pastas, versionamento, compartilhamento e import/export de JSON — totalmente unificado no Firebase.

## Funcionalidades

- Autenticação por chave (MASTER_KEY ou Access Key)
- Sessões permanentes com cookies HTTP-only
- Painel admin para gerar/listar/deletar Access Keys
- CRUD completo de pastas/subpastas/prompts no Firestore
- Versionamento de prompts via `versions[]`
- Compartilhamento de prompts por link
- Importação/Exportação compatível com `Backup_adaptado-EXEMPLO.json`

## Tecnologias

- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Firebase Functions (Node 18)
- Banco: Cloud Firestore
- Auth: Firebase Auth via `customToken`
- Deploy: Firebase Hosting + Functions

## Configuração

Crie `.env.local` com:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Defina a MASTER_KEY somente no backend (Functions):

```
firebase functions:config:set app.master_key="MASTER-KEY-<hash>"
```

## Estrutura

```
/
├── functions/             # Firebase Functions
│   └── index.js           # login/session/logout/keys/shared
├── src/                   # Frontend
│   ├── components/        # UI
│   ├── hooks/             # useAuth/useAdmin
│   ├── lib/               # firebase.js
│   ├── pages/             # Auth/Admin/Dashboard/SharedPrompt
│   └── utils/             # authApi/export/sharing
├── firebase.json          # Hosting rewrites
├── firestore.rules        # Regras de segurança
└── firestore.indexes.json # Índices recomendados
```

## Firestore

- `folders`: `name`, `description`, `parent_id`, `created_at`, `updated_at`
- `prompts`: `folder_id`, `title`, `content`, `tags[]`, `version`, `versions[]`, `created_at`, `updated_at`
- `shared_links`: `prompt_id`, `created_at`, `expires_at`

## Endpoints (Functions)

- `POST /api/login` → valida chave, cria sessão, retorna `customToken`
- `GET /api/session` → valida sessão (permanente)
- `POST /api/logout` → apaga sessão e cookie
- `POST /api/generate-key` → admin gera Access Key
- `GET /api/list-keys` → admin lista chaves
- `POST /api/delete-key` → admin deleta chave
- `GET /api/get-shared?id=...` → obtém prompt por link

## Deploy

```
npm install
npm run build
firebase deploy
```

Para publicar índices: `firebase deploy --only firestore:indexes`.

## Segurança

- MASTER_KEY nunca aparece no frontend
- Cookies `HttpOnly + SameSite=Strict` (usa `Secure` em produção)
- Todas as operações sensíveis apenas via Functions

## MASTER_KEY — geração e rotação

No modelo atual, a MASTER_KEY é lida de `functions.config().app.master_key` e não pode ser gerada/rotacionada programaticamente pelo runtime. A rotação deve ser feita via CLI:

```
firebase functions:config:set app.master_key="MASTER-KEY-<novo-hash>"
firebase deploy --only functions
```

Para gerar um valor seguro localmente:

```
node -e "console.log('MASTER-KEY-'+require('crypto').randomBytes(48).toString('hex'))"
```

## Import/Export

- Importação: aceita `folders[]` com `prompts[]` aninhados; preserva IDs.
- Exportação: gera estrutura compatível com o backup.

## Licença

MIT
