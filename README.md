# Athlete Management App

Aplicação web para gestão de atletas, treinos e exercícios num estúdio de treino.

---

## Getting Started

### Requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose (incluído no Docker Desktop)

### Arrancar a aplicação

```bash
docker compose up -d --build
```

O primeiro build demora alguns minutos (dependências Maven + npm). Builds seguintes usam cache do Docker.

Quando os containers estiverem a correr, abrir **http://localhost:3000** no browser.

| Serviço  | URL                              |
|----------|----------------------------------|
| Frontend | http://localhost:3000             |
| API      | http://localhost:3000/api/coaches |
| Backend  | http://localhost:8080             |

### Acesso pela rede local

Outros computadores na mesma rede podem aceder à app pelo IP da máquina:

```
http://<IP-DA-MAQUINA>:3000
```

### Comandos úteis

```bash
# Ver containers a correr
docker compose ps

# Ver logs (todos os serviços)
docker compose logs -f

# Ver logs (um serviço)
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f frontend

# Parar containers (dados preservados em ./pgdata)
docker compose down

# Reconstruir após alterações de código
docker compose up -d --build

# Reset completo da base de dados
docker compose down
rm -rf ./pgdata
docker compose up -d --build
```

### Testes

```bash
# Backend (78 testes unitários — MockK + JUnit 5)
cd backend && mvn test

# Frontend (81 testes — Vitest + React Testing Library)
cd frontend && npm test

# Frontend com relatório de cobertura
cd frontend && npm run test:coverage
```

---

## Visão Geral

Aplicação web para um estúdio de treino que permite aos treinadores:

- Gerir **atletas**
- Criar uma biblioteca de **exercícios** com diferentes modalidades (Livre, Kineo, Vald)
- Construir **treinos** compostos por exercícios com valores previstos
- Agendar treinos para atletas em dias específicos
- Visualizar treinos num **calendário semanal**
- **Registar resultados** de cada exercício (séries, repetições, peso, cargas Kineo, etc.)
- Consultar **estatísticas e progresso** por atleta com gráficos de evolução

### Modalidades de Exercício

- **Livre** — exercício convencional
- **Kineo** — exercício com máquina Kineo, requer tipo (Isotónico, Isométrico, Isocinético, Elástico, Viscoso, VLC) e cargas específicas por treino
- **Vald** — exercício com equipamento Vald

---

## Stack Tecnológica

| Camada   | Tecnologia                                          |
|----------|-----------------------------------------------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui    |
| Backend  | Kotlin, Spring Boot, Spring Data JPA, Flyway         |
| Base de dados | PostgreSQL 16                                   |
| Infra    | Docker Compose, Nginx (proxy + SPA)                  |

### Arquitectura

```
Browser → Nginx (:3000) → React SPA
                        → /api/* proxy → Spring Boot (:8080) → PostgreSQL (:5432)
```

---

## Estrutura do Projecto

```
├── backend/                 # Kotlin/Spring Boot API
│   ├── src/main/kotlin/     # Código fonte
│   ├── src/main/resources/  # application.yml + migrações Flyway
│   └── Dockerfile
├── frontend/                # React/TypeScript SPA
│   ├── src/                 # Código fonte
│   ├── nginx.conf           # Configuração Nginx (proxy + SPA fallback)
│   └── Dockerfile
├── docs/                    # Documentação técnica
├── docker-compose.yml       # Orquestração dos 3 serviços
└── pgdata/                  # Volume PostgreSQL (gitignored)
```

---

## Documentação

| Ficheiro | Descrição |
|----------|-----------|
| `docs/PRD.md` | Product Requirements Document |
| `docs/DATA_MODEL.md` | Modelo de dados e migrações SQL |
| `docs/API_CONTRACT.md` | Contrato da API REST |
| `docs/BACKEND_ARCHITECTURE.md` | Arquitectura do backend |
| `docs/FRONTEND_ARCHITECTURE.md` | Arquitectura do frontend |
| `docs/INFRASTRUCTURE.md` | Configuração Docker e infraestrutura |
| `docs/EXERCISE_MODALITY.md` | Especificação das modalidades de exercício |
