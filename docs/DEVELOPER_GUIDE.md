# Developer Guide

> **Last Updated:** 2026-03-20

Guide for developers who want to extend or modify the Athlete Management App. Covers local development setup, project structure, and step-by-step instructions for common development tasks.

---

## Table of Contents

- [Local Development Setup](#local-development-setup)
- [Project Structure Walkthrough](#project-structure-walkthrough)
- [How to Add a New Entity (Backend)](#how-to-add-a-new-entity-backend)
- [How to Add a New Page (Frontend)](#how-to-add-a-new-page-frontend)
- [How to Add a New API Endpoint](#how-to-add-a-new-api-endpoint)
- [Testing Strategy](#testing-strategy)
- [Code Style and Conventions](#code-style-and-conventions)
- [Git Workflow Recommendations](#git-workflow-recommendations)

---

## Local Development Setup

You can run the backend and frontend separately outside Docker for a faster development loop. You still need Docker for PostgreSQL.

### Prerequisites

| Tool       | Version  | Purpose                |
|------------|----------|------------------------|
| Java (JDK) | 21+     | Backend runtime        |
| Maven      | 3.9+    | Backend build tool     |
| Node.js    | 20+     | Frontend runtime       |
| npm        | 10+     | Frontend package manager |
| Docker     | 24+     | PostgreSQL database    |

### Step 1: Start PostgreSQL

```bash
# Start only the database container
docker compose up -d postgres
```

This starts PostgreSQL on `localhost:5432` with the credentials from `.env` (or defaults: `athlete`/`athlete`).

### Step 2: Start the Backend

```bash
cd backend

# Run with default dev credentials (connects to localhost:5432)
mvn spring-boot:run
```

The backend starts on `http://localhost:8080`. Flyway migrations run automatically on startup.

The default `application.yml` values point to `localhost:5432` with user `athlete` / password `athlete`, which matches the Docker PostgreSQL defaults. If your `.env` has different credentials, set them as environment variables:

```bash
DB_HOST=localhost DB_USER=athlete DB_PASS=athlete mvn spring-boot:run
```

### Step 3: Start the Frontend

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start the Vite dev server
npm run dev
```

The frontend starts on `http://localhost:5173` with hot module replacement (HMR). It proxies API calls to `http://localhost:8080/api` by default (configured via `VITE_API_URL`).

### Step 4: Open the App

Open `http://localhost:5173` in your browser. Log in with the default credentials (`admin`/`admin`).

### Summary of URLs (Local Dev)

| Service    | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost:5173      |
| Backend    | http://localhost:8080      |
| Database   | localhost:5432             |

---

## Project Structure Walkthrough

### Backend (`backend/`)

```
backend/src/main/kotlin/com/athletemanager/
├── Application.kt                 # Spring Boot entry point
├── auth/                          # Authentication (JWT, login, user management)
│   ├── AppUser.kt                 # JPA entity for app_user table
│   ├── AppUserRepository.kt       # Spring Data repository
│   ├── AppUserDetailsService.kt   # Spring Security UserDetailsService
│   ├── AuthController.kt          # Login, /me, change-password endpoints
│   ├── AuthDto.kt                 # Request/response DTOs
│   ├── JwtService.kt              # JWT generation and validation
│   ├── JwtAuthenticationFilter.kt # Servlet filter for JWT auth
│   ├── AdminSeeder.kt             # Seeds admin account on first startup
│   └── Role.kt                    # Role enum (ADMIN)
├── config/                        # Application configuration
│   ├── SecurityConfig.kt          # Spring Security filter chain, CORS
│   ├── CorsConfig.kt              # CORS configuration
│   ├── AuditLogFilter.kt          # Request audit logging filter
│   ├── AuditEventLogger.kt        # Business event audit logger
│   └── RateLimitFilter.kt         # Rate limiting (Bucket4j)
├── common/                        # Shared code
│   ├── exception/
│   │   ├── ResourceNotFoundException.kt
│   │   ├── BusinessRuleException.kt
│   │   └── GlobalExceptionHandler.kt
│   └── dto/
│       └── ErrorResponse.kt
├── coach/                         # Coach domain
│   ├── Coach.kt                   # Entity
│   ├── CoachRepository.kt         # Repository
│   ├── CoachService.kt            # Business logic
│   ├── CoachController.kt         # REST controller
│   └── CoachDto.kt                # DTOs
├── athlete/                       # (same pattern as coach)
├── exercise/                      # (same pattern, plus ExerciseEnums.kt)
├── workout/                       # (same pattern)
├── workoutexercise/               # (same pattern)
└── exerciseresult/                # (same pattern)
```

**Key pattern:** Each domain module follows the same layered structure: **Entity → Repository → Service → Controller → DTOs**. The service layer contains business logic and throws custom exceptions. The controller layer handles HTTP mapping and validation.

### Frontend (`frontend/src/`)

```
frontend/src/
├── main.tsx                       # App entry point (React root)
├── App.tsx                        # Routing and providers
├── index.css                      # Tailwind directives
├── api/                           # API client modules
│   ├── client.ts                  # Axios instance with interceptors
│   ├── coaches.ts                 # Coach API functions
│   ├── athletes.ts                # Athlete API functions
│   ├── exercises.ts               # Exercise API functions
│   ├── workouts.ts                # Workout API functions
│   ├── workoutExercises.ts        # WorkoutExercise API functions
│   └── exerciseResults.ts         # ExerciseResult API functions
├── types/
│   └── index.ts                   # TypeScript interfaces (mirror API contract)
├── context/
│   ├── AuthContext.tsx             # Authentication state (JWT token, login/logout)
│   └── CoachContext.tsx            # Active coach selection
├── hooks/                         # Custom React hooks (TanStack Query wrappers)
├── pages/                         # Page-level components
│   ├── CalendarPage.tsx
│   ├── AthletesPage.tsx
│   ├── ExercisesPage.tsx
│   ├── WorkoutDetailPage.tsx
│   ├── LoginPage.tsx
│   └── CoachesPage.tsx
├── components/                    # Reusable UI components
│   ├── layout/                    # App shell (sidebar, topbar)
│   ├── calendar/                  # Weekly calendar components
│   ├── athlete/                   # Athlete list/form
│   ├── exercise/                  # Exercise list/form
│   ├── workout/                   # Workout detail components
│   ├── result/                    # Result logging
│   └── ui/                        # shadcn/ui base components
└── lib/
    ├── utils.ts                   # shadcn cn() helper
    └── dateUtils.ts               # Week start/end calculations
```

**Key pattern:** Each feature has an API module (`api/`), TypeScript types (`types/`), a custom hook (`hooks/`), a page component (`pages/`), and UI components (`components/`).

---

## How to Add a New Entity (Backend)

Follow this checklist when adding a new domain entity (e.g., "TrainingPlan").

### 1. Create a Flyway Migration

Create a new SQL file in `backend/src/main/resources/db/migration/`:

```sql
-- V12__add_training_plan.sql
CREATE TABLE training_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    coach_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_tp_coach FOREIGN KEY (coach_id) REFERENCES coach(id) ON DELETE CASCADE
);

CREATE INDEX idx_tp_coach_id ON training_plan(coach_id);
```

**Important:** Use the next version number in sequence. Check existing migrations in `db/migration/` to find the latest version.

### 2. Create the Entity

Create `backend/src/main/kotlin/com/athletemanager/trainingplan/TrainingPlan.kt`:

```kotlin
package com.athletemanager.trainingplan

import com.athletemanager.coach.Coach
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "training_plan")
class TrainingPlan(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null,

    @Column(nullable = false)
    var name: String,

    var description: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    var coach: Coach,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now()
)
```

### 3. Create the Repository

Create `TrainingPlanRepository.kt`:

```kotlin
package com.athletemanager.trainingplan

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface TrainingPlanRepository : JpaRepository<TrainingPlan, UUID> {
    fun findByCoachId(coachId: UUID): List<TrainingPlan>
}
```

### 4. Create DTOs

Create `TrainingPlanDto.kt`:

```kotlin
package com.athletemanager.trainingplan

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.util.UUID

data class CreateTrainingPlanRequest(
    @field:NotBlank @field:Size(max = 255) val name: String,
    val description: String? = null,
    @field:NotNull val coachId: UUID
)

data class TrainingPlanResponse(
    val id: UUID,
    val name: String,
    val description: String?,
    val coachId: UUID,
    val coachName: String
)
```

### 5. Create the Service

Create `TrainingPlanService.kt`:

```kotlin
package com.athletemanager.trainingplan

import com.athletemanager.coach.CoachRepository
import com.athletemanager.common.exception.ResourceNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class TrainingPlanService(
    private val trainingPlanRepository: TrainingPlanRepository,
    private val coachRepository: CoachRepository
) {
    fun findAll(): List<TrainingPlanResponse> =
        trainingPlanRepository.findAll().map { it.toResponse() }

    fun findById(id: UUID): TrainingPlanResponse =
        trainingPlanRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("TrainingPlan not found with id: $id") }
            .toResponse()

    @Transactional
    fun create(request: CreateTrainingPlanRequest): TrainingPlanResponse {
        val coach = coachRepository.findById(request.coachId)
            .orElseThrow { ResourceNotFoundException("Coach not found with id: ${request.coachId}") }

        val plan = TrainingPlan(
            name = request.name,
            description = request.description,
            coach = coach
        )
        return trainingPlanRepository.save(plan).toResponse()
    }

    @Transactional
    fun delete(id: UUID) {
        if (!trainingPlanRepository.existsById(id)) {
            throw ResourceNotFoundException("TrainingPlan not found with id: $id")
        }
        trainingPlanRepository.deleteById(id)
    }

    private fun TrainingPlan.toResponse() = TrainingPlanResponse(
        id = id!!,
        name = name,
        description = description,
        coachId = coach.id!!,
        coachName = coach.name
    )
}
```

### 6. Create the Controller

Create `TrainingPlanController.kt`:

```kotlin
package com.athletemanager.trainingplan

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/training-plans")
class TrainingPlanController(private val service: TrainingPlanService) {

    @GetMapping
    fun findAll() = ResponseEntity.ok(service.findAll())

    @GetMapping("/{id}")
    fun findById(@PathVariable id: UUID) = ResponseEntity.ok(service.findById(id))

    @PostMapping
    fun create(@Valid @RequestBody request: CreateTrainingPlanRequest) =
        ResponseEntity.status(HttpStatus.CREATED).body(service.create(request))

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Void> {
        service.delete(id)
        return ResponseEntity.noContent().build()
    }
}
```

### 7. Write Tests

Create `TrainingPlanServiceTest.kt` in the test directory:

```kotlin
package com.athletemanager.trainingplan

import com.athletemanager.common.exception.ResourceNotFoundException
import io.mockk.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.util.*

class TrainingPlanServiceTest {
    private val repository = mockk<TrainingPlanRepository>()
    private val coachRepository = mockk<com.athletemanager.coach.CoachRepository>()
    private val service = TrainingPlanService(repository, coachRepository)

    @Test
    fun `findById throws when not found`() {
        val id = UUID.randomUUID()
        every { repository.findById(id) } returns Optional.empty()
        assertThrows<ResourceNotFoundException> { service.findById(id) }
    }
}
```

### 8. Update the API Contract

Add the new endpoints to `docs/API_CONTRACT.md`.

---

## How to Add a New Page (Frontend)

Follow this checklist when adding a new page (e.g., "Training Plans").

### 1. Add TypeScript Types

In `frontend/src/types/index.ts`:

```typescript
export interface TrainingPlan {
  id: string;
  name: string;
  description: string | null;
  coachId: string;
  coachName: string;
}

export interface CreateTrainingPlanRequest {
  name: string;
  description?: string;
  coachId: string;
}
```

### 2. Create the API Module

Create `frontend/src/api/trainingPlans.ts`:

```typescript
import { client } from "./client";
import type { TrainingPlan, CreateTrainingPlanRequest } from "../types";

export const getTrainingPlans = () =>
  client.get<TrainingPlan[]>("/training-plans");

export const getTrainingPlan = (id: string) =>
  client.get<TrainingPlan>(`/training-plans/${id}`);

export const createTrainingPlan = (data: CreateTrainingPlanRequest) =>
  client.post<TrainingPlan>("/training-plans", data);

export const deleteTrainingPlan = (id: string) =>
  client.delete(`/training-plans/${id}`);
```

### 3. Create a Custom Hook

Create `frontend/src/hooks/useTrainingPlans.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTrainingPlans, createTrainingPlan, deleteTrainingPlan } from "../api/trainingPlans";
import type { CreateTrainingPlanRequest } from "../types";

export function useTrainingPlans() {
  return useQuery({
    queryKey: ["trainingPlans"],
    queryFn: () => getTrainingPlans().then((res) => res.data),
  });
}

export function useCreateTrainingPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTrainingPlanRequest) =>
      createTrainingPlan(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingPlans"] });
    },
  });
}

export function useDeleteTrainingPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTrainingPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingPlans"] });
    },
  });
}
```

### 4. Create the Page Component

Create `frontend/src/pages/TrainingPlansPage.tsx`:

```typescript
import { useTrainingPlans } from "../hooks/useTrainingPlans";

export default function TrainingPlansPage() {
  const { data: plans, isLoading, error } = useTrainingPlans();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading training plans</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Planos de Treino</h1>
      {/* Render your list/table here */}
    </div>
  );
}
```

### 5. Add the Route

In `frontend/src/App.tsx`, add the route inside the `AppLayout`:

```typescript
import TrainingPlansPage from "./pages/TrainingPlansPage";

// Inside <Routes>:
<Route path="/training-plans" element={<TrainingPlansPage />} />
```

### 6. Add Sidebar Navigation

In `frontend/src/components/layout/Sidebar.tsx` (or `AppLayout.tsx`), add a link:

```typescript
{ path: "/training-plans", label: "Planos de Treino", icon: ClipboardList }
```

### 7. Write Tests

Create tests using Vitest and React Testing Library.

---

## How to Add a New API Endpoint

### Backend

1. **Add the DTO** (if needed) in the domain's `*Dto.kt` file
2. **Add the service method** in `*Service.kt` with business logic
3. **Add the controller method** in `*Controller.kt` with the HTTP mapping
4. **Write a test** for the service method
5. **Update** `docs/API_CONTRACT.md`

### Frontend

1. **Add the API function** in the corresponding `api/*.ts` module
2. **Add the TypeScript type** in `types/index.ts` (if new shapes)
3. **Create or update the hook** in `hooks/`
4. **Update the component** that calls the endpoint

---

## Testing Strategy

### Backend Tests

- **Framework:** JUnit 5 + MockK
- **Pattern:** Unit tests for service layer. Dependencies (repositories) are mocked.
- **Location:** `backend/src/test/kotlin/com/athletemanager/`
- **Naming:** `*ServiceTest.kt` (e.g., `CoachServiceTest.kt`)

```bash
# Run all backend tests
cd backend && mvn test

# Run a specific test class
mvn test -Dtest=CoachServiceTest

# Run with verbose output
mvn test -Dsurefire.useFile=false
```

### Frontend Tests

- **Framework:** Vitest + React Testing Library + jsdom
- **Pattern:** Component rendering tests, hook tests, user interaction tests
- **Location:** Colocated with source files or in `__tests__/` directories

```bash
# Run all frontend tests
cd frontend && npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

### What to Test

| Layer            | What to Test                                     |
|------------------|--------------------------------------------------|
| Backend Service  | Business logic, validation, error cases          |
| Backend Controller | (Optional) Request mapping, status codes       |
| Frontend Hooks   | Query/mutation behavior with mocked API          |
| Frontend Components | Rendering, user interactions, form validation |

---

## Code Style and Conventions

### Backend (Kotlin)

| Convention              | Example                                |
|-------------------------|----------------------------------------|
| Package per domain      | `com.athletemanager.coach`             |
| Entity class names      | `Coach`, `Athlete`, `Workout`          |
| DTO naming              | `CreateXxxRequest`, `XxxResponse`      |
| Service methods          | `findAll()`, `findById()`, `create()`, `update()`, `delete()` |
| Exceptions              | `ResourceNotFoundException`, `BusinessRuleException` |
| Transactions            | `@Transactional` on service write methods |
| Validation              | `@Valid` on controller, `@field:NotBlank` on DTOs |
| Primary keys            | UUID, generated by JPA                 |

### Frontend (TypeScript/React)

| Convention              | Example                                |
|-------------------------|----------------------------------------|
| API modules             | `api/coaches.ts` — one per domain      |
| Types                   | `types/index.ts` — mirrors API contract |
| Hooks                   | `useCoaches.ts` — wraps TanStack Query |
| Pages                   | `CalendarPage.tsx` — one per route     |
| Components              | `components/calendar/WeeklyCalendar.tsx` |
| UI text language        | **Portuguese (pt-PT)** for all user-facing text |
| Code language           | **English** for all code, variables, types, comments |
| State management        | TanStack Query for server state, React Context for client state |
| Styling                 | Tailwind CSS utility classes + shadcn/ui components |

### File Naming

- Kotlin: `PascalCase.kt` (e.g., `CoachService.kt`)
- TypeScript components: `PascalCase.tsx` (e.g., `CalendarPage.tsx`)
- TypeScript modules: `camelCase.ts` (e.g., `coaches.ts`, `dateUtils.ts`)
- SQL migrations: `V{number}__{description}.sql` (e.g., `V10__add_user_table.sql`)

---

## Git Workflow Recommendations

### Branch Strategy

For a small team, a simple branch strategy works well:

```
main (production)
  └── feature/add-training-plans
  └── fix/calendar-date-bug
  └── chore/update-dependencies
```

### Branch Naming

| Prefix     | Use Case                    |
|------------|-----------------------------|
| `feature/` | New features                |
| `fix/`     | Bug fixes                   |
| `chore/`   | Maintenance, dependencies   |
| `docs/`    | Documentation changes       |

### Commit Messages

Use clear, descriptive commit messages:

```
Add training plan CRUD endpoints

- Create entity, repository, service, controller
- Add Flyway migration V12
- Add unit tests for service layer
```

### Development Workflow

1. Create a branch from `main`
2. Make your changes
3. Run tests: `cd backend && mvn test` and `cd frontend && npm test`
4. Commit and push
5. Create a pull request
6. After review, merge to `main`
7. Deploy: `docker compose up -d --build` (see [Deployment Guide](DEPLOYMENT_GUIDE.md))

### Before Committing

```bash
# Backend: run tests and check compilation
cd backend && mvn clean test

# Frontend: run tests and check types
cd frontend && npm test && npx tsc --noEmit

# Frontend: run linter
cd frontend && npm run lint
```
