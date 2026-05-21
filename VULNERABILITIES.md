# Auditoria de Segurança - Vulnerabilidades Encontradas
**Data:** 21 de maio de 2026  
**Score:** 2.5/10 — NÃO PRONTO PARA PRODUÇÃO  
**Total de Vulnerabilidades:** 26 (8 CRÍTICAS, 9 ALTAS, 6 MÉDIAS, 3 BAIXAS)

---

## 🔴 CRÍTICAS (8)

### 1. Endpoint POST /api/push/send desprotegido
- **Arquivo:** `app/api/push/send/route.ts`
- **Erro:** Endpoint aceita requisições sem validação de autenticação ou webhook signature
- **Impacto:** Qualquer pessoa consegue enviar notificações push falsas a todos os utilizadores


### 2. Endpoint GET /api/push/debug expõe secrets
- **Arquivo:** `app/api/push/debug/route.ts` (linhas 1-50)
- **Erro:** Retorna length de SUPABASE_SERVICE_ROLE_KEY e status de configuração VAPID
- **Impacto:** Expõe informações de infraestrutura a atacantes


### 3. Email como super admin
- **Arquivo:** `app/api/admin/users/route.ts` (linha 13)
- **Erro:** `bragawork01@gmail.com` é hardcoded como super admin
- **Impacto:** Single point of failure - se email for comprometido, sistema é totalmente controlado
- **Status:** ✅ CORRIGIDO - RBAC helper criado e endpoints migrados

### 4. XSS em Service Worker - open redirect
- **Arquivo:** `public/sw.js` (linha 23)
- **Erro:** `event.notification.data.url` usado diretamente sem sanitização
- **Impacto:** Notificações push conseguem redirecionar para URLs maliciosas


### 5. Zero rate limiting em qualquer endpoint
- **Arquivo:** Todos endpoints em `app/api/*`
- **Erro:** Sem proteção contra brute force, spam, enumeração
- **Impacto:** Login, registo, endpoints públicos vulneráveis a ataques automatizados
- **Status:** ✅ CORRIGIDO - Rate limiting aplicado em endpoints auth, admin e posts

### 6. Sem validação de input schema
- **Arquivo:** Todos endpoints em `app/api/*`
- **Erro:** Endpoints aceitam JSON arbitrário sem validação Zod/Yup
- **Impacto:** SQL injection, type coercion, malformed payloads
- **Status:** ✅ CORRIGIDO - Zod schema validation aplicada nos endpoints

### 7. Endpoint POST /api/consent aceita userId arbitrário
- **Arquivo:** `app/api/consent/route.ts` (linha 8)
- **Erro:** Utilizador consegue registar consentimento falsificado para outro utilizador
- **Impacto:** Falsificação de consentimento GDPR/LGPD


### 8. GPS location aceito sem validação
- **Arquivo:** `components/RealtimeManager.tsx` (linha 45)
- **Erro:** Coordenadas do utilizador aceitas diretamente sem validar range (-180 a 180 lon, -90 a 90 lat)
- **Impacto:** Utilizadores conseguem falsificar localização
- **Status:** ✅ CORRIGIDO - Validação de latitude/longitude no RealtimeManager


---

## 🟠 ALTAS (9)

### 9. Sem middleware global de autenticação
- **Arquivo:** Falta arquivo `middleware.ts` na raiz
- **Erro:** Routes sensíveis sem validação central de sessão
- **Impacto:** Possível bypass de autenticação, session timeout não enforçado


### 10. Service Role Key exposto em logs de erro
- **Arquivo:** `app/api/push/send/route.ts` (antes da correção)
- **Erro:** Erros podem conter SERVICE_ROLE_KEY em stack traces
- **Impacto:** Chave administrativa vazada via logs públicos


### 11. RLS policy permite ler qualquer perfil
- **Arquivo:** `supabase/migrations/002_rls_policies.sql` (linha ~20)
- **Erro:** `CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);`
- **Impacto:** Todos utilizadores conseguem ler dados sensíveis de qualquer perfil
- **Status:** ✅ CORRIGIDO - RLS policy alterada para auth.role() = 'authenticated'

### 12. RLS policy permite ler qualquer post
- **Arquivo:** `supabase/migrations/011_fix_social_rls.sql` (linha ~10)
- **Erro:** `CREATE POLICY "posts_select_all" ON public.posts FOR SELECT USING (true);`
- **Impacto:** Todos utilizadores conseguem ler posts privados
- **Status:** ✅ CORRIGIDO - RLS policy alterada para auth.role() = 'authenticated'


### 13. Admin endpoint sem validação de propriedade (IDOR)
- **Arquivo:** `app/(app)/profile/[id]/page.tsx` (linha 14)
- **Erro:** Qualquer ID consegue ser acedido sem validar se é propriedade do utilizador
- **Impacto:** Leitura de perfis privados de qualquer utilizador


### 14. Sem validação de Stripe customer_id
- **Arquivo:** `app/api/stripe/webhook/route.ts` (linha ~35)
- **Erro:** Webhook assume metadata.user_id é legítimo, não re-valida contra Stripe
- **Impacto:** Upgrade de premium falsificado para user_id arbitrário
- **Status:** ✅ CORRIGIDO - Webhook valida payment_status e confere utilizador no banco




### 16. Sem CSRF protection em forms
- **Arquivo:** Todos endpoints POST em `app/api/*`
- **Erro:** Sem validação de origin, referrer headers, ou CSRF tokens
- **Impacto:** Cross-site request forgery em formulários
-

### 17. Sem HTTP security headers
- **Arquivo:** `next.config.ts` (antes da correção)
- **Erro:** Sem CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Impacto:** Vulnerável a clickjacking, XSS via browser features, MITM


---

## 🟡 MÉDIAS (6)

### 18. Session timeout muito longo
- **Arquivo:** `app/auth/callback/route.ts` + cookie management
- **Erro:** Session timeout é 1 hora (standards recomendam 15-30 min para apps sensíveis)
- **Impacto:** Session hijacking window amplo

### 19. Sem environment variable validation no startup
- **Arquivo:** Falta em `app/layout.tsx` ou startup
- **Erro:** Aplicação pode fazer deploy sem Supabase/Stripe/VAPID keys configuradas
- **Impacto:** Falhas em runtime, exponha de erros em produção

### 20. Sem audit logging de ações admin
- **Arquivo:** Todos endpoints em `app/api/admin/*`
- **Erro:** Ações sensíveis (ban, delete, impersonate) não são registadas
- **Impacto:** Sem rastreabilidade de mudanças, impossível auditar compromissos
- **Status:** ✅ CORRIGIDO - logAdminAction implementado em todas rotas admin


### 21. Timezone handling pode causar race conditions
- **Arquivo:** `app/api/admin/users/route.ts` + migrations
- **Erro:** Datas de ban/suspend usam timezone do servidor sem UTC normalização
- **Impacto:** Utilizadores banidos conseguem contornar bans via mudança de timezone
- **Status:** ❌ NÃO CORRIGIDO

### 22. Sem file type validation
- **Arquivo:** `app/api/user/export-data/route.ts`
- **Erro:** Export de dados não valida formato de arquivo/encoding
- **Impacto:** Possível escapar de exportação com payloads maliciosos
- **Status:** ❌ NÃO CORRIGIDO

### 23. Logs podem expor dados sensíveis
- **Arquivo:** Console.log e error handling em todos endpoints
- **Erro:** Sem filtro de sensitive fields (passwords, tokens, keys)
- **Impacto:** Dados sensíveis podem aparecer em logs públicos/CI
- **Status:** ❌ NÃO CORRIGIDO

---

## 🔵 BAIXAS (3)

### 24. Enumeração de utilizadores possível
- **Arquivo:** `app/auth/callback/route.ts` + error messages
- **Erro:** Mensagens de erro diferem para "utilizador não existe" vs "password incorreta"
- **Impacto:** Atacante consegue enumerar utilisadores válidos
- **Status:** ❌ NÃO CORRIGIDO

### 25. Error messages vazam informação
- **Arquivo:** Todos endpoints que retornam 400/500
- **Erro:** Stack traces ou mensagens técnicas visíveis ao cliente
- **Impacto:** Informação de reconhecimento para atacantes
- **Status:** ❌ NÃO CORRIGIDO

### 26. Sem limite de tamanho de payload
- **Arquivo:** Todos endpoints POST em `app/api/*`
- **Erro:** Sem configuração de max request body size
- **Impacto:** Possível DoS via upload de payloads gigantescos
- **Status:** ❌ NÃO CORRIGIDO

---
