# Agent Prompt -- Athlete New Fields + Statistics Page

Copy-paste this prompt into a new Cursor Agent chat.

**Attach:** `@docs/PRD.md` `@docs/FRONTEND_ARCHITECTURE.md` `@docs/API_CONTRACT.md` `@frontend/src` `@backend/src/main/kotlin/com/athletemanager/athlete`

---

```
You are improving the Athlete Management App (both backend and frontend).

You have full access to run any shell commands (npm, gradle, etc.) inside /Users/nunesj/trainning-management-app.

The backend is a Kotlin/Spring Boot app in backend/. The frontend is a React/TypeScript app in frontend/. The backend runs at http://localhost:8080.

Read the attached PRD.md, FRONTEND_ARCHITECTURE.md, API_CONTRACT.md, and the backend athlete package.

YOUR TASK has 2 parts. Do them in order.

============================================================
PART 1 -- New Athlete Fields (email, weight, height)
============================================================

Add three new fields to the Athlete entity:
  - email (VARCHAR 255, NOT NULL) -- required
  - weightKg (DECIMAL 5,1, nullable) -- optional, in kilograms
  - heightCm (INT, nullable) -- optional, in centimetres

STEP 1 -- Database migration:
  Create file: backend/src/main/resources/db/migration/V5__add_athlete_fields.sql

  ALTER TABLE athlete ADD COLUMN email VARCHAR(255) NOT NULL DEFAULT '';
  ALTER TABLE athlete ADD COLUMN weight_kg DECIMAL(5,1);
  ALTER TABLE athlete ADD COLUMN height_cm INT;

  -- Update seed athletes with sample data
  UPDATE athlete SET email = 'ze.manel@email.com', weight_kg = 75.0, height_cm = 178 WHERE name = 'Zé Manel';
  UPDATE athlete SET email = 'to.silva@email.com', weight_kg = 82.5, height_cm = 183 WHERE name = 'Tó Silva';
  UPDATE athlete SET email = 'james.lee@email.com', weight_kg = 70.0, height_cm = 172 WHERE name = 'James Lee';

STEP 2 -- Update the JPA entity:
  File: backend/src/main/kotlin/com/athletemanager/athlete/Athlete.kt
  - Add field: var email: String = ""
  - Add field: var weightKg: java.math.BigDecimal? = null (column name "weight_kg")
  - Add field: var heightCm: Int? = null (column name "height_cm")

STEP 3 -- Update DTOs:
  File: backend/src/main/kotlin/com/athletemanager/athlete/AthleteDto.kt

  In CreateAthleteRequest, add:
    @field:NotBlank
    @field:Size(max = 255)
    @field:Email
    val email: String,
    val weightKg: BigDecimal? = null,
    val heightCm: Int? = null

  In AthleteResponse, add:
    val email: String,
    val weightKg: BigDecimal?,
    val heightCm: Int?

  Update the toResponse() extension function to include the new fields.

STEP 4 -- Update AthleteService:
  File: backend/src/main/kotlin/com/athletemanager/athlete/AthleteService.kt
  - In the create() method, set the new fields on the Athlete entity from the request.
  - In the update() method, set the new fields on the Athlete entity from the request.

STEP 5 -- Update frontend TypeScript types:
  File: frontend/src/types/index.ts
  - In the Athlete interface, add:
    email: string;
    weightKg: number | null;
    heightCm: number | null;

STEP 6 -- Update frontend API layer:
  File: frontend/src/api/athletes.ts
  - Add the new fields to the createAthlete and updateAthlete data parameter types:
    email: string;
    weightKg?: number | null;
    heightCm?: number | null;

STEP 7 -- Update AthletesPage form:
  File: frontend/src/pages/AthletesPage.tsx

  Update the AthleteFormData interface:
    - Add: email: string, weightKg: string, heightCm: string
  Update emptyForm accordingly (all empty strings).

  In the create/edit dialog form, add these fields AFTER "Data de Nascimento":

    a) Email (required):
       - Label: "Email *"
       - Input type="email", required
       - Placeholder: "email@exemplo.com"

    b) Peso (kg) (optional):
       - Label: "Peso (kg)"
       - Input type="number", step="0.1", min="0"
       - Placeholder: "Ex: 75.0"

    c) Altura (cm) (optional):
       - Label: "Altura (cm)"
       - Input type="number", step="1", min="0"
       - Placeholder: "Ex: 178"

  Update the handleSubmit payload to include:
    email: form.email.trim(),
    weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
    heightCm: form.heightCm ? parseInt(form.heightCm) : null,

  Update openEdit to populate the new fields from the athlete object.

STEP 8 -- Update AthletesPage table:
  File: frontend/src/pages/AthletesPage.tsx

  - Add an "Email" column after "Nome"
  - Add a "Peso (kg)" column after "Email"
  - Add an "Altura (cm)" column after "Peso (kg)"
  - Display the values, using "—" for null weight/height
  - Remove the <Link> wrapping the athlete name (the /athletes/:id route is being removed). The name should just be plain text with className="font-medium".

============================================================
PART 2 -- Statistics Page (/estatisticas)
============================================================

Create a dedicated statistics page that replaces the current per-athlete progress page.

STEP 9 -- Create StatisticsPage:
  File: frontend/src/pages/StatisticsPage.tsx

  This page combines an athlete selector with the existing progress view.

  Layout:
    - Page header: "Estatísticas" (h1) with subtitle "Análise de progresso e resultados de treino"
    - Below the header: a Select dropdown to choose an athlete
      - The dropdown shows ONLY athletes belonging to the active coach (use useAthletes(activeCoach?.id))
      - Placeholder: "Selecionar atleta..."
      - Each option shows the athlete name
    - If no coach is selected, show: "Por favor selecione um treinador primeiro"
    - If no athlete is selected, show an empty state:
      - Icon: BarChart3 (from lucide-react), large and muted
      - Text: "Selecione um atleta para ver as estatísticas"
      - Subtitle: "Escolha um atleta no menu acima para visualizar o progresso e resultados de treino."
    - When an athlete IS selected:
      - Show a small info line below the selector with the athlete details: name, email, weight (if available), height (if available), coach name
      - Then show the EXACT same content as the current AthleteProgressPage:
        - Stats cards row (Total de Treinos, Concluídos, Falhados, Taxa de Conclusão)
        - Workout history table with expandable rows showing exercise charts
      - Use the existing useAthleteProgress(selectedAthleteId) hook
      - The "back" button in the header is NOT needed (user uses the dropdown to switch athletes)

  Copy all the helper functions and sub-components from AthleteProgressPage.tsx into StatisticsPage.tsx:
    - statusConfig
    - MetricDef, METRICS
    - DataPoint interface
    - getExerciseTimeSeries()
    - hasMetricData()
    - ExerciseChart component

  Import recharts the same way as AthleteProgressPage does.

STEP 10 -- Update routing:
  File: frontend/src/App.tsx
  - Add import: import StatisticsPage from "@/pages/StatisticsPage";
  - Add route: <Route path="/estatisticas" element={<StatisticsPage />} />
  - REMOVE the route: <Route path="/athletes/:id" element={<AthleteProgressPage />} />
  - REMOVE the import of AthleteProgressPage

STEP 11 -- Update sidebar:
  File: frontend/src/components/layout/AppLayout.tsx
  - Add a new nav item AFTER "Atletas":
    { to: "/estatisticas", label: "Estatísticas", icon: BarChart3 }
  - Add BarChart3 to the lucide-react import

STEP 12 -- Delete the old page:
  Delete file: frontend/src/pages/AthleteProgressPage.tsx

STEP 13 -- Clean up references:
  - Search for any remaining imports or links to AthleteProgressPage or /athletes/:id and remove them.
  - In AthletesPage.tsx, make sure the athlete name in the table is plain text (no Link to /athletes/:id). This should already be done in STEP 8.

============================================================
VERIFICATION
============================================================

After making all changes:

1. Restart the backend: cd backend && ./gradlew bootRun (or check it's running)
   - Verify the migration runs without errors
   - Test: curl http://localhost:8080/api/athletes -- should include email, weightKg, heightCm fields

2. Start the frontend: cd frontend && npm run dev
   - Verify no compilation errors

3. Test the following flow:
   a) Go to /athletes -- table now shows Email, Peso, Altura columns
   b) Edit an existing athlete -- form shows email (pre-filled), weight, height fields
   c) Create a new athlete -- email is required, weight and height are optional
   d) Click "Estatísticas" in the sidebar -- opens /estatisticas
   e) Select an athlete from the dropdown -- stats and charts appear
   f) Switch to a different athlete -- content updates
   g) The old /athletes/:id URL should no longer work (404 or redirect)

IMPORTANT:
- All UI text in Portuguese (pt-PT)
- Do NOT change files in src/components/ui/
- Do NOT break existing functionality
- The backend uses Flyway for migrations -- the new file MUST be named V5__add_athlete_fields.sql
- Run both backend and frontend and confirm no errors before finishing
```
