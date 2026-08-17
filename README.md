# SGV — Sistema de Gestão de Viagens

[![Backend CI](https://github.com/MatheusMonteiro10/SGV/actions/workflows/backend-ci.yaml/badge.svg)](https://github.com/MatheusMonteiro10/SGV/actions/workflows/backend-ci.yaml)
[![Frontend CI](https://github.com/MatheusMonteiro10/SGV/actions/workflows/frontend-ci.yaml/badge.svg)](https://github.com/MatheusMonteiro10/SGV/actions/workflows/frontend-ci.yaml)

Aplicação full-stack para gestão de viagens de um motorista autônomo: calendário de agendamentos, histórico de corridas concluídas e dashboard financeiro, com autenticação local e via Google.

##  Links

- **Aplicação (produção):** https://sgv-lovat.vercel.app/
- **API (produção):** https://sgv-dmwj.onrender.com
- **Documentação da API (Swagger UI):** https://sgv-dmwj.onrender.com/swagger-ui.html

> A API roda em plano gratuito do Render — a primeira requisição após um período de inatividade pode levar alguns segundos para responder (cold start).

##  Funcionalidades

- Autenticação local (e-mail/senha, com verificação por código) e login com Google
- Redefinição de senha por código enviado por e-mail
- Calendário mensal com visualização de viagens agendadas e concluídas
- Cadastro, edição, exclusão e conclusão de viagens via modais empilháveis
- Histórico de viagens concluídas com filtros por período e avaliação por estrelas
- Dashboard financeiro: total acumulado, comparação mês a mês, melhor mês do ano e ganhos por dia da semana

##  Stack

**Backend**
- Java 21 · Spring Boot 3.5 · Spring Security · Spring Data JPA
- PostgreSQL (Supabase) · Flyway
- JWT (Auth0 `java-jwt`) · Google OAuth (`google-api-client`)
- springdoc-openapi (Swagger UI)
- Testes: JUnit 5, Mockito, AssertJ, Testcontainers

**Frontend**
- React 19 · TypeScript · Vite
- TanStack Query · React Router · Axios
- Tailwind CSS v4

**Infraestrutura**
- Backend hospedado no Render (Docker)
- Frontend hospedado na Vercel
- CI via GitHub Actions (`backend-ci.yaml`, `frontend-ci.yaml`)

##  Estrutura do repositório

```
SGV/
├── backend/     # API Spring Boot
└── frontend/    # SPA React
```

##  Rodando localmente

### Pré-requisitos

- Java 21+
- Node.js 20+
- Um banco PostgreSQL acessível (ex.: instância local ou projeto no Supabase)
- Conta de e-mail com SMTP habilitado, para envio dos códigos de verificação (ex.: Gmail com senha de app)
- Client ID do Google OAuth ([Google Cloud Console](https://console.cloud.google.com/apis/credentials)), se for testar o login com Google

### Backend

1. Entre na pasta do backend:
   ```bash
   cd backend
   ```

2. Crie um arquivo `.env` na raiz de `backend/` com as variáveis abaixo:
   ```env
   DB_URL=jdbc:postgresql://<host>:<porta>/<database>
   DB_USER=<usuario>
   DB_PASSWORD=<senha>

   JWT_SECRET=<segredo-longo-e-aleatorio>
   JWT_EXPIRATION_MS=3600000

   ALLOWED_ORIGINS=http://localhost:5173

   GOOGLE_CLIENT_ID=<client-id-do-google-oauth>

   EMAIL_USERNAME=<seu-email>
   EMAIL_PASSWORD=<senha-de-app-do-email>

   PORT=8080
   ```

3. Suba a aplicação (as migrations do Flyway rodam automaticamente):
   ```bash
   ./mvnw spring-boot:run
   ```
   No Windows, use `mvnw.cmd spring-boot:run`.

4. A API sobe em `http://localhost:8080` e o Swagger UI fica disponível em `http://localhost:8080/swagger-ui.html`.

#### Rodando os testes do backend

```bash
./mvnw test
```

> Os testes de integração usam Testcontainers e sobem um PostgreSQL real via Docker — é necessário ter o Docker em execução.

### Frontend

1. Entre na pasta do frontend:
   ```bash
   cd frontend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie um arquivo `.env` na raiz de `frontend/`:
   ```env
   VITE_API_URL=http://localhost:8080/api
   VITE_GOOGLE_CLIENT_ID=<mesmo-client-id-do-google-oauth-do-backend>
   ```

4. Suba o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. A aplicação sobe em `http://localhost:5173`.

#### Outros comandos úteis do frontend

```bash
npm run lint      # ESLint
npm run build     # build de produção (tsc -b && vite build)
npm run preview   # preview local do build de produção
```