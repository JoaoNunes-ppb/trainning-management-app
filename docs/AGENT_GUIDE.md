# Agent Guide

How to build the Athlete Management App using AI coding agents.

## How to Use

1. Create a **new chat** for each agent below.
2. Copy-paste the prompt into the chat.
3. Use `@` to attach the doc files listed in the "Attach" section of each agent.
4. Let the agent run. It has full permission to create files, run shell commands, and build the project.
5. After the agent finishes, check the "Done When" criteria before moving to the next agent.
6. Follow the order strictly. Each agent depends on the previous ones.

## Agent Sequence

| #  | Agent Name | Done When |
|----|-----------|-----------|
| 1  | Backend Scaffold | `cd backend && mvn clean install` passes, app starts on :8080 |
| 2  | Coach CRUD | `mvn clean install` passes, `GET /api/coaches` returns seed data |
| 3  | Athlete CRUD | `mvn clean install` passes, `GET /api/athletes` returns seed data |
| 4  | Exercise CRUD | `mvn clean install` passes, `GET /api/exercises` returns seed data |
| 5  | Workout CRUD | `mvn clean install` passes, can create and list workouts by date range |
| 6  | WorkoutExercise CRUD | `mvn clean install` passes, can add/reorder exercises in a workout |
| 7  | ExerciseResult + Workout Detail | `mvn clean install` passes, `GET /api/workouts/{id}` returns full nested detail |
| 8  | Frontend Scaffold | `cd frontend && npm run dev` loads layout with sidebar navigation |
| 9  | Coach Context + Athletes Page | Coach dropdown works, athletes CRUD works against backend |
| 10 | Exercises Page | Exercises CRUD with parameter toggles works against backend |
| 11 | Calendar Page | Weekly calendar renders, filters work, workout cards appear |
| 12 | Workout Creation | Can create a workout by clicking a day on the calendar |
| 13 | Workout Detail Page | Can view workout, add/edit/delete exercises with correct parameter fields |
| 14 | Result Logging | Can log/edit/clear results per exercise, green indicator appears |
| 15 | Infrastructure | `docker compose up -d --build` runs all 3 containers, app works at :3000 |

---

## Agent 1 -- Backend Scaffold

**Attach:** `@docs/BACKEND_ARCHITECTURE.md` `@docs/DATA_MODEL.md`

```
You are building the backend for an Athlete Management App.

You have full access to run any shell commands (mvn, mkdir, etc.) inside the project at /Users/nunesj/trainning-management-app.

Read the attached BACKEND_ARCHITECTURE.md and DATA_MODEL.md carefully. They are your source of truth.

YOUR TASK: Create the Spring Boot + Kotlin + Maven project inside a backend/ folder.

STEP 1 -- Create the project directory structure:
  mkdir -p backend/src/main/kotlin/com/athletemanager/config
  mkdir -p backend/src/main/kotlin/com/athletemanager/common/exception
  mkdir -p backend/src/main/kotlin/com/athletemanager/common/dto
  mkdir -p backend/src/main/resources/db/migration
  mkdir -p backend/src/test/kotlin/com/athletemanager

STEP 2 -- Create backend/pom.xml:
  Copy the EXACT pom.xml from section 8 of BACKEND_ARCHITECTURE.md. Do not change versions or dependencies.

STEP 3 -- Create the main application class:
  File: backend/src/main/kotlin/com/athletemanager/Application.kt
  - Annotated with @SpringBootApplication
  - Has a main() function that calls runApplication<Application>()

STEP 4 -- Create configuration classes:
  File: backend/src/main/kotlin/com/athletemanager/config/CorsConfig.kt
  - Copy from section 7 of BACKEND_ARCHITECTURE.md exactly.

  File: backend/src/main/kotlin/com/athletemanager/config/JacksonConfig.kt
  - A @Configuration class that registers the Jackson Kotlin module if needed (Spring Boot auto-configures this with jackson-module-kotlin on classpath, so this can just be a placeholder or configure date format).

STEP 5 -- Create exception handling:
  File: backend/src/main/kotlin/com/athletemanager/common/exception/ResourceNotFoundException.kt
  - class ResourceNotFoundException(message: String) : RuntimeException(message)

  File: backend/src/main/kotlin/com/athletemanager/common/exception/BusinessRuleException.kt
  - class BusinessRuleException(message: String) : RuntimeException(message)

  File: backend/src/main/kotlin/com/athletemanager/common/dto/ErrorResponse.kt
  - Data class with fields: status (Int), error (String), message (String), timestamp (Instant), fieldErrors (Map<String, String>? = null)

  File: backend/src/main/kotlin/com/athletemanager/common/exception/GlobalExceptionHandler.kt
  - @RestControllerAdvice class as described in section 5 of BACKEND_ARCHITECTURE.md
  - Handle: ResourceNotFoundException -> 404, BusinessRuleException -> 409, MethodArgumentNotValidException -> 400 with fieldErrors, Exception -> 500

STEP 6 -- Create Flyway migrations:
  File: backend/src/main/resources/db/migration/V1__init.sql
  - Copy the EXACT SQL from section 4 of DATA_MODEL.md

  File: backend/src/main/resources/db/migration/V2__seed.sql
  - Copy the EXACT SQL from section 5 of DATA_MODEL.md

STEP 7 -- Create application config files:
  File: backend/src/main/resources/application.yml
  File: backend/src/main/resources/application-local.yml
  File: backend/src/main/resources/application-docker.yml
  - Copy from section 6 of BACKEND_ARCHITECTURE.md exactly.

STEP 8 -- Build and verify:
  Run: cd backend && mvn clean install
  If it fails, read the error and fix it. Repeat until it passes.

  Then run: cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=local
  The app should start on port 8080. Flyway should run both migrations. Check the logs for "Successfully applied 2 migrations".
  Stop the app after verifying.

IMPORTANT:
- Do NOT create any entity, repository, service, or controller classes. Only the scaffold.
- Do NOT skip any step. Create every file listed above.
- If mvn clean install fails, FIX the issue and run it again until it passes.
```

---

## Agent 2 -- Coach CRUD

**Attach:** `@docs/BACKEND_ARCHITECTURE.md` `@docs/API_CONTRACT.md` `@docs/DATA_MODEL.md`

```
You are continuing the backend for an Athlete Management App.

You have full access to run any shell commands (mvn, mkdir, curl, etc.) inside the project at /Users/nunesj/trainning-management-app.

The project scaffold already exists in backend/ with Maven, Spring Boot, Flyway migrations, exception handling, and config files. DO NOT modify any existing files.

Read the attached docs carefully. The API_CONTRACT.md section 1 (Coaches) is your primary reference for endpoints. The DATA_MODEL.md section 2.1 defines the Coach entity.

YOUR TASK: Implement full CRUD for the Coach entity.

STEP 1 -- Create the package:
  mkdir -p backend/src/main/kotlin/com/athletemanager/coach

STEP 2 -- Create the JPA entity:
  File: backend/src/main/kotlin/com/athletemanager/coach/Coach.kt
  - @Entity @Table(name = "coach")
  - Fields: id (UUID, @Id @GeneratedValue(strategy = GenerationType.UUID)), name (String, @Column(nullable = false))

STEP 3 -- Create the repository:
  File: backend/src/main/kotlin/com/athletemanager/coach/CoachRepository.kt
  - Interface extending JpaRepository<Coach, UUID>

STEP 4 -- Create the DTOs:
  File: backend/src/main/kotlin/com/athletemanager/coach/CoachDto.kt
  - data class CreateCoachRequest(@field:NotBlank @field:Size(max = 255) val name: String)
  - data class CoachResponse(val id: UUID, val name: String)
  - Add a toResponse() extension function on Coach entity

STEP 5 -- Create the service:
  File: backend/src/main/kotlin/com/athletemanager/coach/CoachService.kt
  - @Service class injecting CoachRepository
  - findAll(): List<CoachResponse>
  - findById(id: UUID): CoachResponse -- throws ResourceNotFoundException if not found
  - create(request: CreateCoachRequest): CoachResponse
  - update(id: UUID, request: CreateCoachRequest): CoachResponse -- throws ResourceNotFoundException if not found
  - delete(id: UUID) -- throws ResourceNotFoundException if not found

STEP 6 -- Create the controller:
  File: backend/src/main/kotlin/com/athletemanager/coach/CoachController.kt
  - @RestController @RequestMapping("/api/coaches")
  - GET /api/coaches -> 200, List<CoachResponse>
  - POST /api/coaches -> 201 (use ResponseEntity with HttpStatus.CREATED), CoachResponse. Use @Valid @RequestBody.
  - GET /api/coaches/{id} -> 200, CoachResponse
  - PUT /api/coaches/{id} -> 200, CoachResponse. Use @Valid @RequestBody.
  - DELETE /api/coaches/{id} -> 204 (ResponseEntity.noContent().build())

STEP 7 -- Build and verify:
  Run: cd backend && mvn clean install
  If it fails, fix and retry.

  Then start the app: cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=local
  Test with curl (run these in a separate terminal):

  curl -s http://localhost:8080/api/coaches | head
  (Should return the 2 seed coaches)

  curl -s -X POST http://localhost:8080/api/coaches -H "Content-Type: application/json" -d '{"name":"Coach Test"}'
  (Should return 201 with the new coach)

  Stop the app after verifying.

IMPORTANT:
- Do NOT modify any existing files. Only create new files in the coach/ package.
- Match the API contract exactly (paths, status codes, JSON field names).
- Run mvn clean install and make sure it passes before finishing.
```

---

## Agent 3 -- Athlete CRUD

**Attach:** `@docs/BACKEND_ARCHITECTURE.md` `@docs/API_CONTRACT.md` `@docs/DATA_MODEL.md`

```
You are continuing the backend for an Athlete Management App.

You have full access to run any shell commands (mvn, mkdir, curl, etc.) inside the project at /Users/nunesj/trainning-management-app.

The backend/ already has the scaffold and Coach CRUD (entity, repository, service, DTOs, controller in the coach/ package). DO NOT modify any existing files except where explicitly stated.

Read the attached docs. API_CONTRACT.md section 2 (Athletes) defines the endpoints. DATA_MODEL.md section 2.2 defines the entity.

YOUR TASK: Implement full CRUD for the Athlete entity.

STEP 1 -- Create the package:
  mkdir -p backend/src/main/kotlin/com/athletemanager/athlete

STEP 2 -- Create the JPA entity:
  File: backend/src/main/kotlin/com/athletemanager/athlete/Athlete.kt
  - @Entity @Table(name = "athlete")
  - Fields:
    - id: UUID (@Id @GeneratedValue(strategy = GenerationType.UUID))
    - name: String (@Column(nullable = false))
    - dateOfBirth: LocalDate? (@Column(name = "date_of_birth"))
    - notes: String? (@Column(columnDefinition = "TEXT"))
    - coach: Coach (@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "coach_id", nullable = false))

STEP 3 -- Create the repository:
  File: backend/src/main/kotlin/com/athletemanager/athlete/AthleteRepository.kt
  - Interface extending JpaRepository<Athlete, UUID>
  - fun findByCoachId(coachId: UUID): List<Athlete>

STEP 4 -- Create the DTOs:
  File: backend/src/main/kotlin/com/athletemanager/athlete/AthleteDto.kt
  - data class CreateAthleteRequest(
      @field:NotBlank @field:Size(max = 255) val name: String,
      val dateOfBirth: LocalDate? = null,
      @field:NotNull val coachId: UUID,
      val notes: String? = null
    )
  - data class AthleteResponse(
      val id: UUID, val name: String, val dateOfBirth: LocalDate?,
      val coachId: UUID, val coachName: String, val notes: String?
    )
  - Add a toResponse() extension function on Athlete that reads coach.id and coach.name

STEP 5 -- Create the service:
  File: backend/src/main/kotlin/com/athletemanager/athlete/AthleteService.kt
  - @Service class injecting AthleteRepository and CoachRepository
  - findAll(coachId: UUID?): List<AthleteResponse> -- if coachId is provided use findByCoachId, else findAll
  - findById(id: UUID): AthleteResponse -- throw ResourceNotFoundException if not found
  - create(request: CreateAthleteRequest): AthleteResponse -- look up Coach by coachId (throw ResourceNotFoundException if not found), create Athlete
  - update(id: UUID, request: CreateAthleteRequest): AthleteResponse -- look up existing athlete and coach, update fields
  - delete(id: UUID) -- throw ResourceNotFoundException if not found, then delete

STEP 6 -- Create the controller:
  File: backend/src/main/kotlin/com/athletemanager/athlete/AthleteController.kt
  - @RestController @RequestMapping("/api/athletes")
  - GET /api/athletes?coachId={optional UUID} -> 200, List<AthleteResponse>
  - POST /api/athletes -> 201, AthleteResponse (@Valid @RequestBody)
  - GET /api/athletes/{id} -> 200, AthleteResponse
  - PUT /api/athletes/{id} -> 200, AthleteResponse (@Valid @RequestBody)
  - DELETE /api/athletes/{id} -> 204

STEP 7 -- Build and verify:
  Run: cd backend && mvn clean install
  If it fails, fix and retry until it passes.

  Then start the app and test:
  curl -s http://localhost:8080/api/athletes | head
  (Should return 3 seed athletes with coachName populated)

  curl -s "http://localhost:8080/api/athletes?coachId=a1b2c3d4-0001-0000-0000-000000000001" | head
  (Should return only Coach Mike's 2 athletes)

  Stop the app after verifying.

IMPORTANT:
- Do NOT modify existing files. Only create new files in athlete/.
- AthleteResponse MUST include coachName from the Coach relationship.
- Run mvn clean install and make sure it passes.
```

---

## Agent 4 -- Exercise CRUD

**Attach:** `@docs/BACKEND_ARCHITECTURE.md` `@docs/API_CONTRACT.md` `@docs/DATA_MODEL.md`

```
You are continuing the backend for an Athlete Management App.

You have full access to run any shell commands (mvn, mkdir, curl, etc.) inside the project at /Users/nunesj/trainning-management-app.

The backend/ already has the scaffold, Coach CRUD, and Athlete CRUD. DO NOT modify any existing files.

Read the attached docs. API_CONTRACT.md section 3 (Exercises) defines the endpoints. DATA_MODEL.md section 2.3 defines the entity.

YOUR TASK: Implement full CRUD for the Exercise entity (exercise templates).

STEP 1 -- Create the package:
  mkdir -p backend/src/main/kotlin/com/athletemanager/exercise

STEP 2 -- Create the JPA entity:
  File: backend/src/main/kotlin/com/athletemanager/exercise/Exercise.kt
  - @Entity @Table(name = "exercise")
  - Fields:
    - id: UUID (@Id @GeneratedValue(strategy = GenerationType.UUID))
    - name: String (@Column(nullable = false, unique = true))
    - description: String? (@Column(columnDefinition = "TEXT"))
    - hasSets: Boolean = false (@Column(name = "has_sets", nullable = false))
    - hasReps: Boolean = false (@Column(name = "has_reps", nullable = false))
    - hasWeight: Boolean = false (@Column(name = "has_weight", nullable = false))
    - hasDistance: Boolean = false (@Column(name = "has_distance", nullable = false))
    - hasTime: Boolean = false (@Column(name = "has_time", nullable = false))

STEP 3 -- Create the repository:
  File: backend/src/main/kotlin/com/athletemanager/exercise/ExerciseRepository.kt
  - Interface extending JpaRepository<Exercise, UUID>

STEP 4 -- Create the DTOs:
  File: backend/src/main/kotlin/com/athletemanager/exercise/ExerciseDto.kt
  - data class CreateExerciseRequest(
      @field:NotBlank @field:Size(max = 255) val name: String,
      val description: String? = null,
      val hasSets: Boolean = false,
      val hasReps: Boolean = false,
      val hasWeight: Boolean = false,
      val hasDistance: Boolean = false,
      val hasTime: Boolean = false
    )
  - data class ExerciseResponse(
      val id: UUID, val name: String, val description: String?,
      val hasSets: Boolean, val hasReps: Boolean, val hasWeight: Boolean,
      val hasDistance: Boolean, val hasTime: Boolean
    )
  - Add a toResponse() extension function on Exercise

STEP 5 -- Create the service:
  File: backend/src/main/kotlin/com/athletemanager/exercise/ExerciseService.kt
  - @Service class injecting ExerciseRepository
  - findAll(): List<ExerciseResponse>
  - findById(id: UUID): ExerciseResponse -- throw ResourceNotFoundException
  - create(request: CreateExerciseRequest): ExerciseResponse
    - Validate at least one of hasSets/hasReps/hasWeight/hasDistance/hasTime is true, else throw BusinessRuleException("At least one parameter must be enabled")
  - update(id: UUID, request: CreateExerciseRequest): ExerciseResponse -- same validation
  - delete(id: UUID) -- just delete for now; the in-use check will be added by a later agent

STEP 6 -- Create the controller:
  File: backend/src/main/kotlin/com/athletemanager/exercise/ExerciseController.kt
  - @RestController @RequestMapping("/api/exercises")
  - GET /api/exercises -> 200, List<ExerciseResponse>
  - POST /api/exercises -> 201, ExerciseResponse (@Valid @RequestBody)
  - GET /api/exercises/{id} -> 200, ExerciseResponse
  - PUT /api/exercises/{id} -> 200, ExerciseResponse (@Valid @RequestBody)
  - DELETE /api/exercises/{id} -> 204

STEP 7 -- Build and verify:
  Run: cd backend && mvn clean install
  If it fails, fix and retry.

  Then start the app and test:
  curl -s http://localhost:8080/api/exercises | head
  (Should return 4 seed exercises with boolean flags)

  curl -s -X POST http://localhost:8080/api/exercises -H "Content-Type: application/json" -d '{"name":"Deadlift","hasSets":true,"hasReps":true,"hasWeight":true}'
  (Should return 201 with the new exercise)

  curl -s -X POST http://localhost:8080/api/exercises -H "Content-Type: application/json" -d '{"name":"Nothing"}'
  (Should return 409 because no parameter is enabled)

  Stop the app after verifying.

IMPORTANT:
- Do NOT modify existing files. Only create new files in exercise/.
- The validation that at least one parameter flag is true is a business rule, not a Bean Validation annotation. Check it in the service.
- Run mvn clean install and make sure it passes.
```

---

## Agent 5 -- Workout CRUD

**Attach:** `@docs/BACKEND_ARCHITECTURE.md` `@docs/API_CONTRACT.md` `@docs/DATA_MODEL.md`

```
You are continuing the backend for an Athlete Management App.

You have full access to run any shell commands (mvn, mkdir, curl, etc.) inside the project at /Users/nunesj/trainning-management-app.

The backend/ already has Coach, Athlete, and Exercise CRUD. DO NOT modify any existing files.

Read the attached docs. API_CONTRACT.md section 4 (Workouts) defines the endpoints. DATA_MODEL.md section 2.4 defines the entity.

YOUR TASK: Implement CRUD for the Workout entity. This agent does NOT handle WorkoutExercise or ExerciseResult -- just the Workout itself.

STEP 1 -- Create the package:
  mkdir -p backend/src/main/kotlin/com/athletemanager/workout

STEP 2 -- Create the JPA entity:
  File: backend/src/main/kotlin/com/athletemanager/workout/Workout.kt
  - @Entity @Table(name = "workout")
  - Fields:
    - id: UUID (@Id @GeneratedValue(strategy = GenerationType.UUID))
    - label: String (@Column(nullable = false))
    - date: LocalDate (@Column(nullable = false))
    - notes: String? (@Column(columnDefinition = "TEXT"))
    - athlete: Athlete (@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "athlete_id", nullable = false))

STEP 3 -- Create the repository:
  File: backend/src/main/kotlin/com/athletemanager/workout/WorkoutRepository.kt
  - Interface extending JpaRepository<Workout, UUID>
  - fun findByDateBetween(start: LocalDate, end: LocalDate): List<Workout>
  - fun findByAthleteIdAndDateBetween(athleteId: UUID, start: LocalDate, end: LocalDate): List<Workout>
  - fun findByAthlete_Coach_IdAndDateBetween(coachId: UUID, start: LocalDate, end: LocalDate): List<Workout>

STEP 4 -- Create the DTOs:
  File: backend/src/main/kotlin/com/athletemanager/workout/WorkoutDto.kt
  - data class CreateWorkoutRequest(
      @field:NotNull val athleteId: UUID,
      @field:NotBlank @field:Size(max = 255) val label: String,
      @field:NotNull val date: LocalDate,
      val notes: String? = null
    )
  - data class WorkoutSummaryResponse(
      val id: UUID, val athleteId: UUID, val athleteName: String,
      val coachId: UUID, val coachName: String,
      val label: String, val date: LocalDate, val notes: String?,
      val exerciseCount: Int, val hasResults: Boolean
    )
  - Add a toSummaryResponse() extension on Workout. For now, hardcode exerciseCount = 0 and hasResults = false (will be updated by Agent 7).

STEP 5 -- Create the service:
  File: backend/src/main/kotlin/com/athletemanager/workout/WorkoutService.kt
  - @Service class injecting WorkoutRepository and AthleteRepository
  - findAll(startDate: LocalDate, endDate: LocalDate, coachId: UUID?, athleteId: UUID?): List<WorkoutSummaryResponse>
    - If athleteId is provided, use findByAthleteIdAndDateBetween
    - Else if coachId is provided, use findByAthlete_Coach_IdAndDateBetween
    - Else use findByDateBetween
  - findById(id: UUID): Workout -- return entity (used internally). Throw ResourceNotFoundException.
  - findSummaryById(id: UUID): WorkoutSummaryResponse
  - create(request: CreateWorkoutRequest): WorkoutSummaryResponse -- validate athleteId exists
  - update(id: UUID, request: CreateWorkoutRequest): WorkoutSummaryResponse -- validate workout and athlete exist
  - delete(id: UUID) -- throw ResourceNotFoundException if not found

STEP 6 -- Create the controller:
  File: backend/src/main/kotlin/com/athletemanager/workout/WorkoutController.kt
  - @RestController @RequestMapping("/api/workouts")
  - GET /api/workouts?startDate=&endDate=&coachId=&athleteId= -> 200, List<WorkoutSummaryResponse>
    - startDate and endDate are required @RequestParam of type LocalDate
    - coachId and athleteId are optional @RequestParam of type UUID?
  - POST /api/workouts -> 201, WorkoutSummaryResponse
  - GET /api/workouts/{id} -> 200, WorkoutSummaryResponse (this will be changed to detail in Agent 7)
  - PUT /api/workouts/{id} -> 200, WorkoutSummaryResponse
  - DELETE /api/workouts/{id} -> 204

STEP 7 -- Build and verify:
  Run: cd backend && mvn clean install
  If it fails, fix and retry.

  Then start the app and test:
  curl -s -X POST http://localhost:8080/api/workouts -H "Content-Type: application/json" -d '{"athleteId":"a1b2c3d4-0002-0000-0000-000000000001","label":"Test Workout","date":"2026-03-09"}'
  (Should return 201)

  curl -s "http://localhost:8080/api/workouts?startDate=2026-03-09&endDate=2026-03-15"
  (Should return the workout just created)

  curl -s "http://localhost:8080/api/workouts?startDate=2026-03-09&endDate=2026-03-15&coachId=a1b2c3d4-0001-0000-0000-000000000001"
  (Should also return it since the athlete belongs to that coach)

  Stop the app after verifying.

IMPORTANT:
- Do NOT modify existing files. Only create new files in workout/.
- startDate and endDate are REQUIRED query parameters for the list endpoint.
- Run mvn clean install and make sure it passes.
```

---

## Agent 6 -- WorkoutExercise CRUD

**Attach:** `@docs/BACKEND_ARCHITECTURE.md` `@docs/API_CONTRACT.md` `@docs/DATA_MODEL.md`

```
You are continuing the backend for an Athlete Management App.

You have full access to run any shell commands (mvn, mkdir, curl, etc.) inside the project at /Users/nunesj/trainning-management-app.

The backend/ already has Coach, Athlete, Exercise, and Workout CRUD.

Read the attached docs. API_CONTRACT.md section 5 (Workout Exercises) defines the endpoints. DATA_MODEL.md section 2.5 defines the entity.

YOUR TASK: Implement WorkoutExercise -- the exercises within a workout.

STEP 1 -- Create the package:
  mkdir -p backend/src/main/kotlin/com/athletemanager/workoutexercise

STEP 2 -- Create the JPA entity:
  File: backend/src/main/kotlin/com/athletemanager/workoutexercise/WorkoutExercise.kt
  - @Entity @Table(name = "workout_exercise")
  - Fields:
    - id: UUID (@Id @GeneratedValue(strategy = GenerationType.UUID))
    - orderIndex: Int (@Column(name = "order_index", nullable = false))
    - notes: String? (@Column(columnDefinition = "TEXT"))
    - setsExpected: Int? (@Column(name = "sets_expected"))
    - repsExpected: Int? (@Column(name = "reps_expected"))
    - weightExpected: java.math.BigDecimal? (@Column(name = "weight_expected", precision = 10, scale = 2))
    - distanceExpected: java.math.BigDecimal? (@Column(name = "distance_expected", precision = 10, scale = 2))
    - timeExpected: Int? (@Column(name = "time_expected"))
    - workout: Workout (@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "workout_id", nullable = false))
    - exercise: Exercise (@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "exercise_id", nullable = false))

STEP 3 -- Create the repository:
  File: backend/src/main/kotlin/com/athletemanager/workoutexercise/WorkoutExerciseRepository.kt
  - Interface extending JpaRepository<WorkoutExercise, UUID>
  - fun findByWorkoutIdOrderByOrderIndex(workoutId: UUID): List<WorkoutExercise>
  - fun countByExerciseId(exerciseId: UUID): Long

STEP 4 -- Create the DTOs:
  File: backend/src/main/kotlin/com/athletemanager/workoutexercise/WorkoutExerciseDto.kt
  - data class AddWorkoutExerciseRequest(
      @field:NotNull val exerciseId: UUID,
      @field:NotNull @field:Min(0) val orderIndex: Int,
      val notes: String? = null,
      val setsExpected: Int? = null,
      val repsExpected: Int? = null,
      val weightExpected: java.math.BigDecimal? = null,
      val distanceExpected: java.math.BigDecimal? = null,
      val timeExpected: Int? = null
    )
  - data class UpdateWorkoutExerciseRequest(
      @field:NotNull @field:Min(0) val orderIndex: Int,
      val notes: String? = null,
      val setsExpected: Int? = null,
      val repsExpected: Int? = null,
      val weightExpected: java.math.BigDecimal? = null,
      val distanceExpected: java.math.BigDecimal? = null,
      val timeExpected: Int? = null
    )
  - data class ReorderRequest(val orderedIds: List<UUID>)
  - data class WorkoutExerciseResponse(
      val id: UUID, val exerciseId: UUID, val exerciseName: String,
      val orderIndex: Int, val notes: String?,
      val setsExpected: Int?, val repsExpected: Int?,
      val weightExpected: java.math.BigDecimal?, val distanceExpected: java.math.BigDecimal?,
      val timeExpected: Int?
    )
  - Add toResponse() extension on WorkoutExercise that reads exercise.name

STEP 5 -- Create the service:
  File: backend/src/main/kotlin/com/athletemanager/workoutexercise/WorkoutExerciseService.kt
  - @Service class injecting WorkoutExerciseRepository, WorkoutRepository (or WorkoutService), ExerciseRepository
  - listByWorkout(workoutId: UUID): List<WorkoutExerciseResponse>
  - add(workoutId: UUID, request: AddWorkoutExerciseRequest): WorkoutExerciseResponse
    - Validate workout exists and exercise exists (throw ResourceNotFoundException if not)
  - update(workoutId: UUID, id: UUID, request: UpdateWorkoutExerciseRequest): WorkoutExerciseResponse
    - Validate the workout exercise exists and belongs to the given workout
  - delete(workoutId: UUID, id: UUID)
    - Validate exists and belongs to workout
  - reorder(workoutId: UUID, orderedIds: List<UUID>)
    - Fetch all workout exercises for the workout
    - Validate orderedIds contains exactly the same IDs
    - Assign orderIndex 0, 1, 2... based on position in orderedIds
    - Save all

STEP 6 -- Create the controller:
  File: backend/src/main/kotlin/com/athletemanager/workoutexercise/WorkoutExerciseController.kt
  - @RestController @RequestMapping("/api/workouts/{workoutId}/exercises")
  - POST -> 201, WorkoutExerciseResponse (@Valid @RequestBody)
  - PUT /{id} -> 200, WorkoutExerciseResponse (@Valid @RequestBody)
  - DELETE /{id} -> 204
  - PUT /reorder -> 200 (@RequestBody ReorderRequest)

STEP 7 -- Update ExerciseService to check usage before delete:
  THIS IS THE ONLY EXISTING FILE YOU MAY MODIFY: backend/src/main/kotlin/com/athletemanager/exercise/ExerciseService.kt
  - Inject WorkoutExerciseRepository
  - In the delete() method, before deleting, check: if (workoutExerciseRepository.countByExerciseId(id) > 0) throw BusinessRuleException("Cannot delete exercise that is used in workouts")

STEP 8 -- Build and verify:
  Run: cd backend && mvn clean install
  If it fails, fix and retry.

  Then start the app and test:
  First create a workout (or use an existing one), then add an exercise to it:
  curl -s -X POST http://localhost:8080/api/workouts/{workoutId}/exercises -H "Content-Type: application/json" -d '{"exerciseId":"a1b2c3d4-0003-0000-0000-000000000001","orderIndex":0,"setsExpected":3,"repsExpected":10,"weightExpected":80.00}'

  Test reorder:
  curl -s -X PUT http://localhost:8080/api/workouts/{workoutId}/exercises/reorder -H "Content-Type: application/json" -d '{"orderedIds":["id2","id1"]}'

  Stop the app after verifying.

IMPORTANT:
- Only modify ExerciseService.kt. Create all other files as new.
- Run mvn clean install and make sure it passes.
```

---

## Agent 7 -- ExerciseResult + Workout Detail Endpoint

**Attach:** `@docs/BACKEND_ARCHITECTURE.md` `@docs/API_CONTRACT.md` `@docs/DATA_MODEL.md`

```
You are continuing the backend for an Athlete Management App.

You have full access to run any shell commands (mvn, mkdir, curl, etc.) inside the project at /Users/nunesj/trainning-management-app.

The backend/ already has Coach, Athlete, Exercise, Workout, and WorkoutExercise CRUD.

Read the attached docs. API_CONTRACT.md section 6 (Exercise Results) and section 4 (GET /api/workouts/{id} detail response) are your primary references.

YOUR TASK has two parts:

===== PART A: ExerciseResult CRUD =====

STEP 1 -- Create the package:
  mkdir -p backend/src/main/kotlin/com/athletemanager/exerciseresult

STEP 2 -- Create the JPA entity:
  File: backend/src/main/kotlin/com/athletemanager/exerciseresult/ExerciseResult.kt
  - @Entity @Table(name = "exercise_result")
  - Fields:
    - id: UUID (@Id @GeneratedValue(strategy = GenerationType.UUID))
    - sets: Int?
    - reps: Int?
    - weight: java.math.BigDecimal? (@Column(precision = 10, scale = 2))
    - distance: java.math.BigDecimal? (@Column(precision = 10, scale = 2))
    - time: Int?
    - notes: String? (@Column(columnDefinition = "TEXT"))
    - workoutExercise: WorkoutExercise (@OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "workout_exercise_id", nullable = false, unique = true))

STEP 3 -- Create the repository:
  File: backend/src/main/kotlin/com/athletemanager/exerciseresult/ExerciseResultRepository.kt
  - fun findByWorkoutExerciseId(workoutExerciseId: UUID): ExerciseResult?

STEP 4 -- Create the DTOs:
  File: backend/src/main/kotlin/com/athletemanager/exerciseresult/ExerciseResultDto.kt
  - data class UpsertExerciseResultRequest(sets?, reps?, weight?, distance?, time?, notes?)
  - data class ExerciseResultResponse(id, workoutExerciseId, sets, reps, weight, distance, time, notes)

STEP 5 -- Create the service:
  File: backend/src/main/kotlin/com/athletemanager/exerciseresult/ExerciseResultService.kt
  - @Service class
  - get(workoutExerciseId: UUID): ExerciseResultResponse -- throw ResourceNotFoundException if WorkoutExercise or Result not found
  - upsert(workoutExerciseId: UUID, request): ExerciseResultResponse -- find existing result or create new one
  - delete(workoutExerciseId: UUID) -- throw ResourceNotFoundException if not found

STEP 6 -- Create the controller:
  File: backend/src/main/kotlin/com/athletemanager/exerciseresult/ExerciseResultController.kt
  - @RestController @RequestMapping("/api/workout-exercises/{workoutExerciseId}/result")
  - GET -> 200, ExerciseResultResponse
  - PUT -> 200, ExerciseResultResponse (upsert)
  - DELETE -> 204

===== PART B: Update Workout Detail Endpoint =====

YOU MUST MODIFY these existing files:

STEP 7 -- Update WorkoutDto.kt:
  File: backend/src/main/kotlin/com/athletemanager/workout/WorkoutDto.kt
  ADD these new DTOs (keep existing ones):
  - data class WorkoutDetailResponse(
      val id: UUID, val athleteId: UUID, val athleteName: String,
      val coachId: UUID, val coachName: String,
      val label: String, val date: LocalDate, val notes: String?,
      val exercises: List<WorkoutExerciseDetailResponse>
    )
  - data class WorkoutExerciseDetailResponse(
      val id: UUID, val exerciseId: UUID, val exerciseName: String,
      val orderIndex: Int, val notes: String?,
      val setsExpected: Int?, val repsExpected: Int?,
      val weightExpected: BigDecimal?, val distanceExpected: BigDecimal?,
      val timeExpected: Int?,
      val exercise: ExerciseInfo,
      val result: ExerciseResultInfo?
    )
  - data class ExerciseInfo(val id: UUID, val name: String, val hasSets: Boolean, val hasReps: Boolean, val hasWeight: Boolean, val hasDistance: Boolean, val hasTime: Boolean)
  - data class ExerciseResultInfo(val id: UUID, val sets: Int?, val reps: Int?, val weight: BigDecimal?, val distance: BigDecimal?, val time: Int?, val notes: String?)

STEP 8 -- Update WorkoutService.kt:
  File: backend/src/main/kotlin/com/athletemanager/workout/WorkoutService.kt
  ADD a new method: findDetailById(id: UUID): WorkoutDetailResponse
  - Fetch the Workout entity
  - Fetch its WorkoutExercises (ordered by orderIndex) using WorkoutExerciseRepository
  - For each WorkoutExercise, fetch the ExerciseResult (if any) using ExerciseResultRepository
  - Build and return WorkoutDetailResponse with the full nested structure
  - Inject WorkoutExerciseRepository and ExerciseResultRepository

  ALSO UPDATE the toSummaryResponse() extension (or wherever exerciseCount and hasResults are computed):
  - exerciseCount: count of workout exercises for this workout
  - hasResults: true if at least one workout exercise has a result

STEP 9 -- Update WorkoutController.kt:
  File: backend/src/main/kotlin/com/athletemanager/workout/WorkoutController.kt
  CHANGE the GET /api/workouts/{id} endpoint to return WorkoutDetailResponse instead of WorkoutSummaryResponse.
  Call findDetailById instead of findSummaryById.

STEP 10 -- Build and verify:
  Run: cd backend && mvn clean install
  If it fails, fix and retry.

  Then start the app and test the full flow:
  1. Create a workout
  2. Add exercises to it
  3. Log a result for one exercise
  4. GET /api/workouts/{id} should return the full nested response with exercises and results

  curl -s http://localhost:8080/api/workouts/{id} | python3 -m json.tool
  (Should show exercises array with nested exercise info and result)

  Stop the app after verifying.

IMPORTANT:
- Create all exerciseresult/ files as new.
- Modify WorkoutDto.kt, WorkoutService.kt, and WorkoutController.kt as described.
- Do NOT modify any other existing files.
- Run mvn clean install and make sure it passes.
```

---

## Agent 8 -- Frontend Scaffold

**Attach:** `@docs/FRONTEND_ARCHITECTURE.md`

```
You are building the frontend for an Athlete Management App.

You have full access to run any shell commands (npm, mkdir, npx, etc.) inside the project at /Users/nunesj/trainning-management-app.

Read the attached FRONTEND_ARCHITECTURE.md carefully. It is your source of truth.

YOUR TASK: Create the React + TypeScript project in a frontend/ folder.

STEP 1 -- Create the Vite project:
  cd /Users/nunesj/trainning-management-app
  npm create vite@latest frontend -- --template react-ts
  cd frontend
  npm install

STEP 2 -- Install and configure Tailwind CSS:
  npm install -D tailwindcss @tailwindcss/vite
  Configure tailwind in vite.config.ts and add @import "tailwindcss" to src/index.css.
  Clear out the default Vite CSS and App content.

STEP 3 -- Initialize shadcn/ui:
  npx shadcn@latest init
  Accept defaults (New York style, neutral color, CSS variables yes).
  Install components that will be needed: button, input, label, dialog, table, select, card, badge, checkbox, textarea, separator, dropdown-menu, toast, sonner
  Run: npx shadcn@latest add button input label dialog table select card badge checkbox textarea separator dropdown-menu toast sonner

STEP 4 -- Install additional dependencies:
  npm install react-router-dom @tanstack/react-query axios date-fns lucide-react

STEP 5 -- Create the API client:
  File: src/api/client.ts
  - Create an Axios instance with baseURL: "/api" (the Vite proxy will forward to backend)

STEP 6 -- Create TypeScript types:
  File: src/types/index.ts
  - Copy ALL interfaces from section 4 of FRONTEND_ARCHITECTURE.md:
    Coach, Athlete, Exercise, WorkoutSummary, WorkoutDetail, WorkoutExerciseDetail, ExerciseResult, CalendarViewMode

STEP 7 -- Create utility files:
  File: src/lib/utils.ts -- with the shadcn cn() helper (may already exist from shadcn init)

  File: src/lib/dateUtils.ts:
  - getWeekStart(date: Date): Date -- uses startOfWeek from date-fns with { weekStartsOn: 1 }
  - getWeekEnd(date: Date): Date -- uses endOfWeek with { weekStartsOn: 1 }
  - formatDateParam(date: Date): string -- formats as "yyyy-MM-dd" for API params
  - formatDisplayDate(date: Date): string -- formats as "MMM d, yyyy" for UI

STEP 8 -- Create the layout:
  File: src/components/layout/AppLayout.tsx
  - A flex layout with a left sidebar and main content area
  - Sidebar has navigation links: "Calendar" (to /), "Athletes" (to /athletes), "Exercises" (to /exercises)
  - Use lucide-react icons: Calendar, Users, Dumbbell
  - Top bar with app title "Athlete Manager" and placeholder text "Coach Selector" (will be replaced by Agent 9)
  - Main area renders <Outlet /> from react-router-dom
  - Use Tailwind classes for styling. Make it look clean and professional.

STEP 9 -- Create placeholder pages:
  File: src/pages/CalendarPage.tsx -- renders <h1>Calendar</h1>
  File: src/pages/AthletesPage.tsx -- renders <h1>Athletes</h1>
  File: src/pages/ExercisesPage.tsx -- renders <h1>Exercises</h1>
  File: src/pages/WorkoutDetailPage.tsx -- renders <h1>Workout Detail</h1>

STEP 10 -- Set up routing:
  File: src/App.tsx
  - BrowserRouter with Routes inside AppLayout:
    / -> CalendarPage
    /athletes -> AthletesPage
    /exercises -> ExercisesPage
    /workouts/:id -> WorkoutDetailPage

STEP 11 -- Set up providers:
  File: src/main.tsx
  - Wrap App with QueryClientProvider from @tanstack/react-query
  - Create a QueryClient instance
  - Add the Toaster from sonner for toast notifications

STEP 12 -- Configure Vite proxy:
  File: vite.config.ts
  - Add server.proxy: "/api" -> "http://localhost:8080"

STEP 13 -- Verify:
  cd frontend && npm run dev
  Open http://localhost:5173 in the browser.
  - The layout should show with a sidebar and top bar.
  - Clicking sidebar links should navigate between placeholder pages.
  - No console errors.

IMPORTANT:
- Do NOT implement any real page content. Only the scaffold.
- Make the layout look professional with good spacing, colors, and typography.
- ALL user-facing text (sidebar links, page titles, top bar) MUST be in Portuguese (pt-PT). See section 8 of FRONTEND_ARCHITECTURE.md for the full translation reference. Code, variables, and types stay in English.
- Run npm run dev and verify it works before finishing.
```

---

## Agent 9 -- Coach Context + Athletes Page

**Attach:** `@docs/FRONTEND_ARCHITECTURE.md` `@docs/API_CONTRACT.md`

```
You are continuing the frontend for an Athlete Management App.

You have full access to run any shell commands inside /Users/nunesj/trainning-management-app.

The frontend/ scaffold exists with routing, layout, types, and API client.
The backend is running at http://localhost:8080 with seed data (2 coaches: "Coach Mike" and "Coach Sarah", 3 athletes).

Read the attached docs.

PREREQUISITE: The backend must be running. Start it if needed:
  cd /Users/nunesj/trainning-management-app/backend && mvn spring-boot:run -Dspring-boot.run.profiles=local &

YOUR TASK has two parts:

===== PART A: Coach Context and Selector =====

STEP 1 -- Create the coaches API module:
  File: src/api/coaches.ts
  - import { client } from "./client"
  - import { Coach } from "../types"
  - export const getCoaches = () => client.get<Coach[]>("/coaches").then(res => res.data)

STEP 2 -- Create the coaches hook:
  File: src/hooks/useCoaches.ts
  - useCoaches() hook using useQuery with key ["coaches"], calls getCoaches

STEP 3 -- Create the coach context:
  File: src/context/CoachContext.tsx
  - CoachContext with value: { activeCoach: Coach | null, setActiveCoach: (coach: Coach) => void }
  - CoachProvider component that:
    - Reads initial coach from localStorage (key "activeCoach", JSON parsed)
    - On setActiveCoach, saves to localStorage and updates state
  - useCoachContext() custom hook for consuming the context

STEP 4 -- Wire up the context:
  Update src/main.tsx: wrap the app with <CoachProvider> (inside QueryClientProvider)

STEP 5 -- Add the coach selector to the layout:
  Update src/components/layout/AppLayout.tsx (or create a TopBar component):
  - Replace "Coach Selector" placeholder with a real dropdown
  - Fetch coaches using useCoaches() hook
  - Show a shadcn/ui Select component with coach names
  - On selection, call setActiveCoach from context
  - Show the active coach name when selected
  - If no coach is selected yet, show "Select a coach..."

===== PART B: Athletes Page =====

STEP 6 -- Create the athletes API module:
  File: src/api/athletes.ts
  - getAthletes(coachId?: string) -> GET /api/athletes with optional coachId param
  - createAthlete(data) -> POST /api/athletes
  - updateAthlete(id, data) -> PUT /api/athletes/{id}
  - deleteAthlete(id) -> DELETE /api/athletes/{id}

STEP 7 -- Create the athletes hooks:
  File: src/hooks/useAthletes.ts
  - useAthletes(coachId?: string) -- useQuery with key ["athletes", { coachId }]
  - useCreateAthlete() -- useMutation, invalidates ["athletes"] on success
  - useUpdateAthlete() -- useMutation, invalidates ["athletes"] on success
  - useDeleteAthlete() -- useMutation, invalidates ["athletes"] on success

STEP 8 -- Implement the Athletes page:
  File: src/pages/AthletesPage.tsx
  - Get activeCoach from CoachContext
  - Fetch athletes filtered by activeCoach.id (if a coach is selected)
  - Show a shadcn/ui Table with columns: Name, Date of Birth, Notes, Actions
  - "Add Athlete" button at the top opens a Dialog with a form:
    - Name input (required)
    - Date of Birth input (type date, optional)
    - Notes textarea (optional)
    - The coachId is automatically set from activeCoach
    - If no coach is selected, show a message "Please select a coach first"
  - Each row has Edit (pencil icon) and Delete (trash icon) action buttons
  - Edit opens the same dialog pre-filled with existing data
  - Delete shows a confirmation dialog, then calls deleteAthlete
  - Show loading state while fetching
  - Show empty state when no athletes exist
  - Show toast notifications on success/error

STEP 9 -- Verify:
  cd frontend && npm run dev
  Open http://localhost:5173
  - Coach dropdown should show "Coach Mike" and "Coach Sarah"
  - Select a coach, navigate to Athletes page
  - Seed athletes should appear in the table
  - Create, edit, and delete an athlete
  - Switch coach and see different athletes
  - Refresh the page -- the selected coach should persist

IMPORTANT:
- Do NOT modify types, API client, or routing setup.
- Use shadcn/ui components everywhere (Button, Dialog, Input, Table, Select, Label, Textarea).
- Use toast (from sonner) for success/error feedback.
- ALL user-facing text (labels, headings, buttons, placeholders, table headers, toasts, empty states, confirmation messages) MUST be in Portuguese (pt-PT). See section 8 of FRONTEND_ARCHITECTURE.md for the full translation reference. Code, variables, and types stay in English.
```

---

## Agent 10 -- Exercises Page

**Attach:** `@docs/FRONTEND_ARCHITECTURE.md` `@docs/API_CONTRACT.md`

```
You are continuing the frontend for an Athlete Management App.

You have full access to run any shell commands inside /Users/nunesj/trainning-management-app.

The frontend/ has layout, coach context, and athletes page working.
The backend is running at http://localhost:8080 with seed data (4 exercises).

Read the attached docs.

PREREQUISITE: Backend running. If not:
  cd /Users/nunesj/trainning-management-app/backend && mvn spring-boot:run -Dspring-boot.run.profiles=local &

YOUR TASK: Implement the Exercises page.

STEP 1 -- Create the exercises API module:
  File: src/api/exercises.ts
  - getExercises() -> GET /api/exercises, returns Exercise[]
  - createExercise(data) -> POST /api/exercises
  - updateExercise(id, data) -> PUT /api/exercises/{id}
  - deleteExercise(id) -> DELETE /api/exercises/{id}

STEP 2 -- Create the exercises hooks:
  File: src/hooks/useExercises.ts
  - useExercises() -- useQuery with key ["exercises"]
  - useCreateExercise() -- useMutation, invalidates ["exercises"]
  - useUpdateExercise() -- useMutation, invalidates ["exercises"]
  - useDeleteExercise() -- useMutation, invalidates ["exercises"]. On error, if status 409, show toast "Cannot delete exercise that is used in workouts"

STEP 3 -- Create the ParameterToggles component:
  File: src/components/exercise/ParameterToggles.tsx
  - Receives props: value (object with hasSets, hasReps, hasWeight, hasDistance, hasTime booleans) and onChange handler
  - Renders 5 shadcn/ui Checkbox components in a row/grid:
    - "Sets" (hasSets)
    - "Reps" (hasReps)
    - "Weight (kg)" (hasWeight)
    - "Distance (m)" (hasDistance)
    - "Time (s)" (hasTime)
  - Each checkbox toggles the corresponding boolean

STEP 4 -- Create the ExerciseForm component:
  File: src/components/exercise/ExerciseForm.tsx
  - A form inside a Dialog for creating/editing exercises
  - Fields: Name (Input, required), Description (Textarea, optional), ParameterToggles
  - Validation: name must not be empty, at least one parameter must be toggled on
  - On submit, calls createExercise or updateExercise depending on mode
  - Shows toast on success, closes dialog

STEP 5 -- Implement the Exercises page:
  File: src/pages/ExercisesPage.tsx
  - Fetch all exercises using useExercises()
  - Show a shadcn/ui Table with columns: Name, Description, Parameters, Actions
  - The Parameters column shows small Badge components for each enabled parameter (e.g., "Sets", "Reps", "Weight" badges with distinct colors)
  - "Add Exercise" button opens ExerciseForm dialog in create mode
  - Each row has Edit (opens ExerciseForm pre-filled) and Delete (confirmation dialog) actions
  - On delete error 409, show toast with the error message
  - Loading and empty states

STEP 6 -- Verify:
  cd frontend && npm run dev
  Open http://localhost:5173/exercises
  - 4 seed exercises should appear with parameter badges
  - "Bench Press" should show Sets, Reps, Weight badges
  - "5K Run" should show Distance, Time badges
  - Create a new exercise with custom parameters
  - Edit an exercise
  - Try to delete "Bench Press" after it's used in a workout (should show error toast if it's in use)

IMPORTANT:
- Do NOT modify existing files except replacing the ExercisesPage placeholder.
- Parameter badges should be visually distinct (use different Badge variants or colors).
- Use toast for all success/error feedback.
- ALL user-facing text MUST be in Portuguese (pt-PT). Use the translation table in section 8 of FRONTEND_ARCHITECTURE.md. Parameter labels: "Séries", "Repetições", "Peso (kg)", "Distância (m)", "Tempo (s)". Code stays in English.
```

---

## Agent 11 -- Calendar Page

**Attach:** `@docs/FRONTEND_ARCHITECTURE.md` `@docs/API_CONTRACT.md`

```
You are continuing the frontend for an Athlete Management App.

You have full access to run any shell commands inside /Users/nunesj/trainning-management-app.

The frontend/ has layout, coach context, athletes page, and exercises page working.
The backend is running at http://localhost:8080.

Read the attached docs. This is the MAIN FEATURE of the app.

PREREQUISITE: Backend running. Create some test workouts via curl so the calendar has data to display:
  curl -s -X POST http://localhost:8080/api/workouts -H "Content-Type: application/json" -d '{"athleteId":"a1b2c3d4-0002-0000-0000-000000000001","label":"Upper Body Strength","date":"2026-03-09"}'
  curl -s -X POST http://localhost:8080/api/workouts -H "Content-Type: application/json" -d '{"athleteId":"a1b2c3d4-0002-0000-0000-000000000002","label":"Running Intervals","date":"2026-03-10"}'
  curl -s -X POST http://localhost:8080/api/workouts -H "Content-Type: application/json" -d '{"athleteId":"a1b2c3d4-0002-0000-0000-000000000003","label":"Cycling Endurance","date":"2026-03-11"}'

YOUR TASK: Implement the weekly calendar page.

STEP 1 -- Create the workouts API module:
  File: src/api/workouts.ts
  - getWorkouts(params: { startDate: string, endDate: string, coachId?: string, athleteId?: string }) -> GET /api/workouts with query params, returns WorkoutSummary[]
  (Only the list endpoint for now. Other functions will be added by later agents.)

STEP 2 -- Create the calendar hook:
  File: src/hooks/useCalendar.ts
  - useCalendarWorkouts(startDate: string, endDate: string, coachId?: string, athleteId?: string)
  - useQuery with key ["workouts", { startDate, endDate, coachId, athleteId }]
  - Calls getWorkouts

STEP 3 -- Create CalendarHeader component:
  File: src/components/calendar/CalendarHeader.tsx
  - Props: weekStart (Date), onPrevWeek, onNextWeek, onToday
  - Displays: "Mar 9 - Mar 15, 2026" (formatted week range)
  - Left arrow button (ChevronLeft icon), right arrow button (ChevronRight icon), "Today" button
  - Clean, centered layout

STEP 4 -- Create CalendarFilterBar component:
  File: src/components/calendar/CalendarFilterBar.tsx
  - Props: viewMode, onViewModeChange, selectedCoachId, onCoachChange, selectedAthleteId, onAthleteChange
  - Three tab-like buttons: "All Athletes", "By Coach", "By Athlete"
  - When "By Coach" is active, show a coach dropdown (fetch coaches). Default to activeCoach from context.
  - When "By Athlete" is active, show an athlete dropdown (fetch athletes, optionally filtered by activeCoach).
  - Use shadcn/ui Button (for tabs) and Select (for dropdowns)

STEP 5 -- Create WorkoutCard component:
  File: src/components/calendar/WorkoutCard.tsx
  - Props: workout (WorkoutSummary)
  - Compact card showing:
    - Workout label (bold, truncated if long)
    - Athlete name (smaller, muted text)
    - Exercise count badge (e.g., "4 exercises")
    - Small green checkmark (CheckCircle icon from lucide) if hasResults is true
  - Clicking the card navigates to /workouts/{workout.id} using useNavigate
  - Use shadcn/ui Card with hover effect

STEP 6 -- Create DayColumn component:
  File: src/components/calendar/DayColumn.tsx
  - Props: date (Date), workouts (WorkoutSummary[]), onDayClick (date: Date) => void
  - Shows: day name (Mon, Tue...), date number, list of WorkoutCard components
  - Highlight today's column with a subtle different background
  - Clicking the empty area of the column calls onDayClick(date) -- this will be used by Agent 12 to open workout creation
  - If no workouts, show a subtle "+" icon to invite clicking
  - Minimum height so empty days still look good

STEP 7 -- Create WeeklyCalendar component:
  File: src/components/calendar/WeeklyCalendar.tsx
  - State: currentWeekStart (Date, defaults to getWeekStart(new Date()))
  - State: viewMode (CalendarViewMode, defaults to "byCoach")
  - State: selectedCoachId (defaults to activeCoach.id from context)
  - State: selectedAthleteId
  - Compute weekEnd from weekStart
  - Fetch workouts using useCalendarWorkouts with the appropriate filters based on viewMode
  - Group workouts by date (use isSameDay from date-fns)
  - Generate 7 days using eachDayOfInterval from date-fns
  - Render CalendarHeader, CalendarFilterBar, and a 7-column grid of DayColumn components
  - The grid should be responsive: use CSS grid with 7 equal columns on desktop
  - Pass onDayClick as a no-op for now (Agent 12 will wire it up)

STEP 8 -- Update CalendarPage:
  File: src/pages/CalendarPage.tsx
  - Replace placeholder with <WeeklyCalendar />

STEP 9 -- Verify:
  cd frontend && npm run dev
  Open http://localhost:5173
  - Calendar should show the current week with 7 day columns
  - Navigate weeks with arrows, "Today" jumps back
  - Switch filter modes: "All Athletes" shows all, "By Coach" filters by coach, "By Athlete" filters by one athlete
  - Workout cards should appear on the correct days for the test data created above
  - Clicking a workout card should navigate to /workouts/{id} (shows placeholder page for now)

IMPORTANT:
- Do NOT modify existing files except replacing CalendarPage placeholder.
- Use date-fns for ALL date calculations. Always use weekStartsOn: 1 (Monday).
- The 7-column grid must look balanced and professional.
- Handle loading states with skeleton/spinner.
- ALL user-facing text MUST be in Portuguese (pt-PT). Day headers: Seg, Ter, Qua, Qui, Sex, Sáb, Dom. Buttons: "Hoje", "Todos os Atletas", "Por Treinador", "Por Atleta". Use date-fns pt locale for date formatting. See section 8 of FRONTEND_ARCHITECTURE.md. Code stays in English.
```

---

## Agent 12 -- Workout Creation

**Attach:** `@docs/FRONTEND_ARCHITECTURE.md` `@docs/API_CONTRACT.md`

```
You are continuing the frontend for an Athlete Management App.

You have full access to run any shell commands inside /Users/nunesj/trainning-management-app.

The frontend/ has the calendar page working with all three view modes.
The backend is running at http://localhost:8080.

Read the attached docs.

YOUR TASK: Implement the workout creation flow from the calendar.

STEP 1 -- Add createWorkout to the workouts API:
  Update file: src/api/workouts.ts
  ADD (do not remove existing functions):
  - createWorkout(data: { athleteId: string, label: string, date: string, notes?: string }) -> POST /api/workouts, returns WorkoutSummary

STEP 2 -- Create the workout mutation hook:
  File: src/hooks/useWorkouts.ts
  - useCreateWorkout() -- useMutation calling createWorkout, invalidates ["workouts"] on success, shows toast on success ("Workout created") and error

STEP 3 -- Create the WorkoutForm dialog:
  File: src/components/workout/WorkoutForm.tsx
  - Props: open (boolean), onOpenChange, defaultDate? (string, pre-filled from calendar click), onSuccess? (callback)
  - A Dialog containing a form:
    - Athlete dropdown: fetch athletes filtered by activeCoach. Use shadcn/ui Select.
    - Label input (required, text)
    - Date input (required, pre-filled with defaultDate if provided)
    - Notes textarea (optional)
  - On submit: call createWorkout mutation, close dialog on success
  - Validation: athlete required, label required, date required
  - If no coach selected in context, show message "Select a coach first"

STEP 4 -- Wire up the calendar:
  Update src/components/calendar/WeeklyCalendar.tsx:
  - Add state: showCreateDialog (boolean), createDate (string | null)
  - Pass onDayClick handler to DayColumn that sets createDate and opens the dialog
  - Render <WorkoutForm open={showCreateDialog} defaultDate={createDate} onOpenChange={setShowCreateDialog} />
  - Optionally add a "New Workout" button in the CalendarHeader area that opens the form without a pre-filled date

STEP 5 -- Verify:
  cd frontend && npm run dev
  - Click on an empty area of a day column -> WorkoutForm dialog opens with the date pre-filled
  - Select an athlete, enter a label, submit
  - The new workout card should appear on the calendar immediately (query invalidation)
  - Click "New Workout" button (if added) -> form opens without pre-filled date

IMPORTANT:
- Only modify workouts.ts (add function) and WeeklyCalendar.tsx (add dialog state and handler).
- Create WorkoutForm.tsx and useWorkouts.ts as new files.
- The form should be clean and easy to use.
- ALL user-facing text MUST be in Portuguese (pt-PT). E.g., "Novo Treino", "Título", "Data", "Guardar", "Cancelar", "Selecionar treinador". See section 8 of FRONTEND_ARCHITECTURE.md. Code stays in English.
```

---

## Agent 13 -- Workout Detail Page

**Attach:** `@docs/FRONTEND_ARCHITECTURE.md` `@docs/API_CONTRACT.md`

```
You are continuing the frontend for an Athlete Management App.

You have full access to run any shell commands inside /Users/nunesj/trainning-management-app.

The frontend/ has the calendar and workout creation working. Clicking a workout card navigates to /workouts/:id.
The backend is running at http://localhost:8080.

Read the attached docs. API_CONTRACT.md sections 4 and 5 are your primary reference.

YOUR TASK: Implement the Workout Detail page.

STEP 1 -- Add functions to the workouts API:
  Update file: src/api/workouts.ts
  ADD (keep existing functions):
  - getWorkout(id: string) -> GET /api/workouts/{id}, returns WorkoutDetail
  - updateWorkout(id: string, data) -> PUT /api/workouts/{id}, returns WorkoutSummary
  - deleteWorkout(id: string) -> DELETE /api/workouts/{id}

STEP 2 -- Create the workout exercises API:
  File: src/api/workoutExercises.ts
  - addExercise(workoutId, data) -> POST /api/workouts/{workoutId}/exercises
  - updateExercise(workoutId, id, data) -> PUT /api/workouts/{workoutId}/exercises/{id}
  - deleteExercise(workoutId, id) -> DELETE /api/workouts/{workoutId}/exercises/{id}
  - reorderExercises(workoutId, orderedIds) -> PUT /api/workouts/{workoutId}/exercises/reorder

STEP 3 -- Add hooks:
  Update file: src/hooks/useWorkouts.ts
  ADD:
  - useWorkout(id: string) -- useQuery with key ["workout", id], calls getWorkout
  - useUpdateWorkout() -- useMutation, invalidates ["workout", id] and ["workouts"]
  - useDeleteWorkout() -- useMutation, invalidates ["workouts"]

  File: src/hooks/useWorkoutExercises.ts
  - useAddExercise(workoutId) -- useMutation, invalidates ["workout", workoutId]
  - useUpdateExercise(workoutId) -- useMutation, invalidates ["workout", workoutId]
  - useDeleteExercise(workoutId) -- useMutation, invalidates ["workout", workoutId]
  - useReorderExercises(workoutId) -- useMutation, invalidates ["workout", workoutId]

STEP 4 -- Create WorkoutHeader component:
  File: src/components/workout/WorkoutHeader.tsx
  - Props: workout (WorkoutDetail)
  - Displays: label (large heading), date (formatted), athlete name, coach name, notes
  - "Edit" button opens a dialog to edit label, date, notes, athleteId (reuse or adapt WorkoutForm)
  - "Delete" button shows confirmation dialog. On confirm, deletes and navigates back to /
  - "Back to Calendar" link/button

STEP 5 -- Create AddExerciseDialog component:
  File: src/components/workout/AddExerciseDialog.tsx
  - Dialog for adding an exercise to the workout
  - Step 1: Select an exercise from the library (dropdown fetching exercises)
  - Step 2: After selecting, show input fields ONLY for the parameters enabled on that exercise:
    - If exercise.hasSets -> "Sets" number input
    - If exercise.hasReps -> "Reps" number input
    - If exercise.hasWeight -> "Weight (kg)" number input
    - If exercise.hasDistance -> "Distance (m)" number input
    - If exercise.hasTime -> "Time (s)" number input
  - Notes textarea (optional)
  - On submit, calls addExercise with orderIndex = current exercise count

STEP 6 -- Create WorkoutExerciseItem component:
  File: src/components/workout/WorkoutExerciseItem.tsx
  - Props: workoutExercise (WorkoutExerciseDetail), workoutId (string)
  - Shows exercise name (bold), and expected values ONLY for enabled parameters:
    - Use the workoutExercise.exercise.hasSets/hasReps/etc. flags to decide which to show
    - Format like: "3 sets x 10 reps @ 80 kg" (only showing enabled params)
  - Shows notes if any
  - Edit button: opens an inline edit form or dialog to change expected values and notes
  - Delete button: confirmation dialog, calls deleteExercise
  - Placeholder area for result logging (Agent 14 will fill this in)

STEP 7 -- Create WorkoutExerciseList component:
  File: src/components/workout/WorkoutExerciseList.tsx
  - Props: exercises (WorkoutExerciseDetail[]), workoutId (string)
  - Renders the list of WorkoutExerciseItem components in order
  - "Add Exercise" button at the bottom opens AddExerciseDialog
  - Empty state: "No exercises yet. Add one to get started."

STEP 8 -- Implement WorkoutDetailPage:
  File: src/pages/WorkoutDetailPage.tsx
  - Get the workout ID from useParams
  - Fetch workout detail using useWorkout(id)
  - Render WorkoutHeader and WorkoutExerciseList
  - Loading state (spinner or skeleton)
  - Error state (workout not found)

STEP 9 -- Verify:
  cd frontend && npm run dev
  - Create a workout from the calendar, click on it
  - Workout detail page should load with header info
  - Click "Add Exercise", select "Bench Press", see sets/reps/weight fields only
  - Submit, exercise appears in the list
  - Add "5K Run", see only distance/time fields
  - Edit expected values on an exercise
  - Delete an exercise
  - Edit workout header (change label)
  - Delete workout (navigates back to calendar)

IMPORTANT:
- Only modify workouts.ts (add functions) and useWorkouts.ts (add hooks).
- Create all component files as new. Replace WorkoutDetailPage placeholder.
- CRITICAL: Only show parameter input fields that are enabled on the exercise template. Use the exercise.hasSets, exercise.hasReps, etc. flags.
- ALL user-facing text MUST be in Portuguese (pt-PT). E.g., "Detalhe do Treino", "Adicionar Exercício", "Editar", "Eliminar", "Voltar ao Calendário", "Previsto", "Séries", "Repetições", "Peso (kg)", "Distância (m)", "Tempo (s)". See section 8 of FRONTEND_ARCHITECTURE.md. Code stays in English.
```

---

## Agent 14 -- Result Logging

**Attach:** `@docs/FRONTEND_ARCHITECTURE.md` `@docs/API_CONTRACT.md`

```
You are continuing the frontend for an Athlete Management App.

You have full access to run any shell commands inside /Users/nunesj/trainning-management-app.

The frontend/ has the workout detail page working with exercise list.
The backend is running at http://localhost:8080.

Read the attached docs. API_CONTRACT.md section 6 (Exercise Results) is your primary reference.

YOUR TASK: Implement exercise result logging.

STEP 1 -- Create the exercise results API:
  File: src/api/exerciseResults.ts
  - upsertResult(workoutExerciseId: string, data: { sets?, reps?, weight?, distance?, time?, notes? }) -> PUT /api/workout-exercises/{workoutExerciseId}/result
  - deleteResult(workoutExerciseId: string) -> DELETE /api/workout-exercises/{workoutExerciseId}/result

STEP 2 -- Create the results hooks:
  File: src/hooks/useExerciseResults.ts
  - useUpsertResult(workoutId: string) -- useMutation calling upsertResult, invalidates ["workout", workoutId] on success, toast "Results saved"
  - useDeleteResult(workoutId: string) -- useMutation calling deleteResult, invalidates ["workout", workoutId] on success, toast "Results cleared"

STEP 3 -- Create the ResultLogger component:
  File: src/components/result/ResultLogger.tsx
  - Props: workoutExercise (WorkoutExerciseDetail), workoutId (string)
  - A collapsible/expandable section within each exercise item
  - Toggle button: shows "Log Results" if no result, "Edit Results" if result exists
  - When expanded, show a form with input fields ONLY for parameters enabled on the exercise template:
    - exercise.hasSets -> "Actual Sets" number input
    - exercise.hasReps -> "Actual Reps" number input
    - exercise.hasWeight -> "Actual Weight (kg)" number input
    - exercise.hasDistance -> "Actual Distance (m)" number input
    - exercise.hasTime -> "Actual Time (s)" number input
    - Notes textarea (optional)
  - Pre-fill inputs with existing result data if workoutExercise.result is not null
  - "Save" button calls upsertResult
  - "Clear Results" button (only visible if result exists) calls deleteResult with confirmation
  - After saving, collapse the form and show a green checkmark (CheckCircle icon from lucide)

STEP 4 -- Integrate into WorkoutExerciseItem:
  Update src/components/workout/WorkoutExerciseItem.tsx:
  - Add the ResultLogger component below the expected values section
  - Show a visual distinction between expected and actual:
    - Expected values: labeled "Expected" in muted text
    - Actual values (when result exists): labeled "Actual" with green text or a green border
  - Show a green checkmark icon next to the exercise name if result is logged (workoutExercise.result is not null)

STEP 5 -- Verify:
  cd frontend && npm run dev
  - Navigate to a workout with exercises
  - Click "Log Results" on an exercise
  - Only the relevant parameter fields should appear (matching the exercise template)
  - Fill in values, click Save
  - Green checkmark should appear
  - Expand again, values should be pre-filled
  - Click "Clear Results", confirm, checkmark should disappear
  - Go back to calendar -- the workout card should show the green checkmark if hasResults is true

IMPORTANT:
- Create exerciseResults.ts, useExerciseResults.ts, and ResultLogger.tsx as new files.
- Only modify WorkoutExerciseItem.tsx to integrate the ResultLogger.
- CRITICAL: Only show parameter fields that are enabled on the exercise template.
- The expected vs actual visual distinction should be clear and clean.
- ALL user-facing text MUST be in Portuguese (pt-PT). E.g., "Registar Resultados", "Editar Resultados", "Limpar Resultados", "Guardar", "Previsto", "Realizado", "Resultados guardados", "Resultados limpos". See section 8 of FRONTEND_ARCHITECTURE.md. Code stays in English.
```

---

## Agent 15 -- Infrastructure (Docker)

**Attach:** `@docs/INFRASTRUCTURE.md`

```
You are setting up Docker infrastructure for an Athlete Management App.

You have full access to run any shell commands inside /Users/nunesj/trainning-management-app.

The backend/ (Maven + Spring Boot + Kotlin) and frontend/ (Vite + React) are fully implemented and working locally.

Read the attached INFRASTRUCTURE.md carefully. It is your source of truth.

YOUR TASK: Create Docker setup for the full stack.

STEP 1 -- Create docker-compose.yml at the project root:
  File: /Users/nunesj/trainning-management-app/docker-compose.yml
  - Copy the EXACT docker-compose.yml from section 2 of INFRASTRUCTURE.md
  - Three services: postgres, app, frontend
  - The postgres volume MUST be ./pgdata:/var/lib/postgresql/data

STEP 2 -- Create the backend Dockerfile:
  File: /Users/nunesj/trainning-management-app/backend/Dockerfile
  - Multi-stage build as specified in section 3:
    - Stage 1: maven:3.9-eclipse-temurin-21, copies pom.xml, runs mvn dependency:go-offline, copies src, runs mvn package -DskipTests
    - Stage 2: eclipse-temurin:21-jre-alpine, copies jar from target/

STEP 3 -- Create the frontend Dockerfile:
  File: /Users/nunesj/trainning-management-app/frontend/Dockerfile
  - Multi-stage build as specified in section 4:
    - Stage 1: node:20-alpine, npm ci, npm run build
    - Stage 2: nginx:alpine, copies dist and nginx.conf

STEP 4 -- Create the nginx config:
  File: /Users/nunesj/trainning-management-app/frontend/nginx.conf
  - Copy from section 4 of INFRASTRUCTURE.md
  - Proxy /api/ to http://app:8080/api/
  - SPA fallback: try_files $uri $uri/ /index.html

STEP 5 -- Update .gitignore:
  Add pgdata/ to /Users/nunesj/trainning-management-app/.gitignore (create the file if it doesn't exist)

STEP 6 -- Build and verify:
  cd /Users/nunesj/trainning-management-app
  docker compose up -d --build

  Wait for all containers to start (check with docker compose ps).
  Check logs: docker compose logs app (should see Spring Boot started successfully)

  Test:
  - curl http://localhost:3000 (should return HTML)
  - curl http://localhost:3000/api/coaches (should return seed coach data via Nginx proxy)
  - Open http://localhost:3000 in browser -- full app should work

  Test persistence:
  - docker compose down
  - docker compose up -d
  - curl http://localhost:3000/api/coaches (data should still be there)

IMPORTANT:
- The docker-compose.yml goes at the PROJECT ROOT, not inside backend/ or frontend/.
- The Dockerfile for backend must use mvn package, NOT mvn clean install (skip tests in Docker build).
- The pgdata volume MUST persist data to the host filesystem.
- Make sure all three containers start and communicate correctly.
```
