# Agent Prompt -- Exercise Modality (Livre / Kineo / Vald)

Copy-paste this prompt into a new Cursor Agent chat.

**Attach:** `@docs/EXERCISE_MODALITY.md` `@docs/API_CONTRACT.md` `@docs/FRONTEND_ARCHITECTURE.md` `@backend/src/main/kotlin/com/athletemanager/exercise` `@frontend/src/components/exercise` `@frontend/src/types/index.ts` `@frontend/src/api/exercises.ts` `@frontend/src/pages/ExercisesPage.tsx` `@frontend/src/hooks/useExercises.ts`

---

```
You are improving the Athlete Management App (both backend and frontend).

You have full access to run any shell commands (npm, gradle, etc.) inside /Users/nunesj/trainning-management-app.

The backend is a Kotlin/Spring Boot app in backend/. The frontend is a React/TypeScript app in frontend/. The backend runs at http://localhost:8080. The database is PostgreSQL managed via Flyway migrations.

Read the attached EXERCISE_MODALITY.md for the full specification. Read the other attached files to understand the current code.

YOUR TASK: Add a "Modalidade" (modality) field to exercises. Exercises can be Livre, Kineo, or Vald. Kineo exercises require additional sub-type and load fields.

============================================================
PART 1 -- Database Migration
============================================================

STEP 1 -- Create migration file:
  File: backend/src/main/resources/db/migration/V6__add_exercise_modality.sql

  ALTER TABLE exercise
    ADD COLUMN modality VARCHAR(10) NOT NULL DEFAULT 'LIVRE',
    ADD COLUMN kineo_type VARCHAR(30),
    ADD COLUMN concentric_load NUMERIC(10,2),
    ADD COLUMN eccentric_load NUMERIC(10,2),
    ADD COLUMN isometric_load NUMERIC(10,2);

  This sets all existing exercises to LIVRE by default.

============================================================
PART 2 -- Backend Enums
============================================================

STEP 2 -- Create enums file:
  File: backend/src/main/kotlin/com/athletemanager/exercise/ExerciseEnums.kt

  package com.athletemanager.exercise

  enum class Modality { LIVRE, KINEO, VALD }
  enum class KineoType { ISOTONICO, ISOMETRICO, ISOCINETICO, ELASTICO, VISCOSO, VLC }

============================================================
PART 3 -- Backend Entity
============================================================

STEP 3 -- Update Exercise entity:
  File: backend/src/main/kotlin/com/athletemanager/exercise/Exercise.kt

  Add these fields to the Exercise class:

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var modality: Modality = Modality.LIVRE,

    @Enumerated(EnumType.STRING)
    @Column(name = "kineo_type")
    var kineoType: KineoType? = null,

    @Column(name = "concentric_load")
    var concentricLoad: Double? = null,

    @Column(name = "eccentric_load")
    var eccentricLoad: Double? = null,

    @Column(name = "isometric_load")
    var isometricLoad: Double? = null

  Make sure to add the necessary imports for Enumerated, EnumType.

============================================================
PART 4 -- Backend DTOs
============================================================

STEP 4 -- Update CreateExerciseRequest:
  File: backend/src/main/kotlin/com/athletemanager/exercise/ExerciseDto.kt

  Add to CreateExerciseRequest:
    val modality: Modality = Modality.LIVRE,
    val kineoType: KineoType? = null,
    val concentricLoad: Double? = null,
    val eccentricLoad: Double? = null,
    val isometricLoad: Double? = null

STEP 5 -- Update ExerciseResponse:
  Same file. Add to ExerciseResponse:
    val modality: Modality,
    val kineoType: KineoType?,
    val concentricLoad: Double?,
    val eccentricLoad: Double?,
    val isometricLoad: Double?

STEP 6 -- Update toResponse() mapper:
  Same file. Add the new fields to the toResponse() extension function:
    modality = this.modality,
    kineoType = this.kineoType,
    concentricLoad = this.concentricLoad,
    eccentricLoad = this.eccentricLoad,
    isometricLoad = this.isometricLoad

============================================================
PART 5 -- Backend Service Validation
============================================================

STEP 7 -- Update ExerciseService create method:
  File: backend/src/main/kotlin/com/athletemanager/exercise/ExerciseService.kt

  In the create() method, add the new fields when constructing the Exercise:
    modality = request.modality,
    kineoType = request.kineoType,
    concentricLoad = request.concentricLoad,
    eccentricLoad = request.eccentricLoad,
    isometricLoad = request.isometricLoad

  Before saving, call a new validation method: validateKineoFields(request)

STEP 8 -- Update ExerciseService update method:
  Same file. In the update() method, set the new fields on the existing entity:
    exercise.modality = request.modality
    exercise.kineoType = request.kineoType
    exercise.concentricLoad = request.concentricLoad
    exercise.eccentricLoad = request.eccentricLoad
    exercise.isometricLoad = request.isometricLoad

  Also call validateKineoFields(request) before saving.

STEP 9 -- Add validateKineoFields method:
  Same file. Add a private validation method:

  private fun validateKineoFields(request: CreateExerciseRequest) {
      if (request.modality == Modality.KINEO) {
          if (request.kineoType == null) {
              throw BusinessRuleException("Kineo type is required when modality is KINEO")
          }
          if (request.kineoType == KineoType.ISOMETRICO) {
              if (request.isometricLoad == null) {
                  throw BusinessRuleException("Isometric load is required for ISOMETRICO type")
              }
          } else {
              if (request.concentricLoad == null || request.eccentricLoad == null) {
                  throw BusinessRuleException("Concentric and eccentric loads are required for ${request.kineoType} type")
              }
          }
      }
  }

============================================================
PART 6 -- Frontend Types
============================================================

STEP 10 -- Update TypeScript types:
  File: frontend/src/types/index.ts

  Add these type aliases BEFORE the Exercise interface:
    export type Modality = "LIVRE" | "KINEO" | "VALD";
    export type KineoType = "ISOTONICO" | "ISOMETRICO" | "ISOCINETICO" | "ELASTICO" | "VISCOSO" | "VLC";

  Add to the Exercise interface (after hasTime):
    modality: Modality;
    kineoType: KineoType | null;
    concentricLoad: number | null;
    eccentricLoad: number | null;
    isometricLoad: number | null;

============================================================
PART 7 -- Frontend API
============================================================

STEP 11 -- Update ExercisePayload:
  File: frontend/src/api/exercises.ts

  Add to ExercisePayload interface:
    modality: Modality;
    kineoType?: KineoType | null;
    concentricLoad?: number | null;
    eccentricLoad?: number | null;
    isometricLoad?: number | null;

  Add the necessary type imports from "@/types".

============================================================
PART 8 -- Frontend Form
============================================================

STEP 12 -- Update ExerciseForm component:
  File: frontend/src/components/exercise/ExerciseForm.tsx

  This is the most complex change. The form must now support modality selection and conditional Kineo fields.

  a) Add new state variables:
    const [modality, setModality] = useState<Modality>("LIVRE");
    const [kineoType, setKineoType] = useState<KineoType | "">("");
    const [concentricLoad, setConcentricLoad] = useState("");
    const [eccentricLoad, setEccentricLoad] = useState("");
    const [isometricLoad, setIsometricLoad] = useState("");

  b) Import the Modality and KineoType types from "@/types".

  c) Import Select, SelectContent, SelectItem, SelectTrigger, SelectValue from "@/components/ui/select".

  d) Update the useEffect that runs when `open` changes:
    When editing (exercise exists), populate the new state from the exercise:
      setModality(exercise.modality);
      setKineoType(exercise.kineoType ?? "");
      setConcentricLoad(exercise.concentricLoad?.toString() ?? "");
      setEccentricLoad(exercise.eccentricLoad?.toString() ?? "");
      setIsometricLoad(exercise.isometricLoad?.toString() ?? "");
    When creating (no exercise), reset to defaults:
      setModality("LIVRE");
      setKineoType("");
      setConcentricLoad("");
      setEccentricLoad("");
      setIsometricLoad("");

  e) Add a "Modalidade" Select field right AFTER the "Nome" field and BEFORE the "Descrição" field:

    <div className="space-y-2">
      <Label>Modalidade *</Label>
      <Select value={modality} onValueChange={(val) => {
        setModality(val as Modality);
        if (val !== "KINEO") {
          setKineoType("");
          setConcentricLoad("");
          setEccentricLoad("");
          setIsometricLoad("");
        }
      }}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="LIVRE">Livre</SelectItem>
          <SelectItem value="KINEO">Kineo</SelectItem>
          <SelectItem value="VALD">Vald</SelectItem>
        </SelectContent>
      </Select>
    </div>

  f) Add a Kineo sub-section that only appears when modality is "KINEO".
     Place it AFTER the Modalidade field, BEFORE Descrição:

    {modality === "KINEO" && (
      <div className="space-y-4 rounded-lg border p-4">
        <div className="space-y-2">
          <Label>Tipo Kineo *</Label>
          <Select value={kineoType} onValueChange={(val) => {
            setKineoType(val as KineoType);
            setConcentricLoad("");
            setEccentricLoad("");
            setIsometricLoad("");
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecionar tipo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ISOTONICO">Isotónico</SelectItem>
              <SelectItem value="ISOMETRICO">Isométrico</SelectItem>
              <SelectItem value="ISOCINETICO">Isocinético</SelectItem>
              <SelectItem value="ELASTICO">Elástico</SelectItem>
              <SelectItem value="VISCOSO">Viscoso</SelectItem>
              <SelectItem value="VLC">VLC Carga Variável</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {kineoType === "ISOMETRICO" && (
          <div className="space-y-2">
            <Label htmlFor="isometric-load">Carga Isométrica (Kg) *</Label>
            <Input
              id="isometric-load"
              type="number"
              min={0}
              step="0.01"
              required
              value={isometricLoad}
              onChange={(e) => setIsometricLoad(e.target.value)}
              placeholder="Ex: 50"
            />
          </div>
        )}

        {kineoType && kineoType !== "ISOMETRICO" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="concentric-load">Carga Concêntrica (Kg) *</Label>
              <Input
                id="concentric-load"
                type="number"
                min={0}
                step="0.01"
                required
                value={concentricLoad}
                onChange={(e) => setConcentricLoad(e.target.value)}
                placeholder="Ex: 40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eccentric-load">Carga Excêntrica (Kg) *</Label>
              <Input
                id="eccentric-load"
                type="number"
                min={0}
                step="0.01"
                required
                value={eccentricLoad}
                onChange={(e) => setEccentricLoad(e.target.value)}
                placeholder="Ex: 60"
              />
            </div>
          </div>
        )}
      </div>
    )}

  g) Update handleSubmit validation:
    After the existing "at least one parameter" check, add Kineo validation:

    if (modality === "KINEO") {
      if (!kineoType) {
        setValidationError("Tipo Kineo é obrigatório.");
        return;
      }
      if (kineoType === "ISOMETRICO" && !isometricLoad) {
        setValidationError("Carga isométrica é obrigatória.");
        return;
      }
      if (kineoType !== "ISOMETRICO" && (!concentricLoad || !eccentricLoad)) {
        setValidationError("Cargas concêntrica e excêntrica são obrigatórias.");
        return;
      }
    }

  h) Update the payload object in handleSubmit:
    Add the new fields:

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      ...flags,
      modality,
      kineoType: modality === "KINEO" ? kineoType as KineoType : null,
      concentricLoad: modality === "KINEO" && kineoType !== "ISOMETRICO" && concentricLoad
        ? Number(concentricLoad) : null,
      eccentricLoad: modality === "KINEO" && kineoType !== "ISOMETRICO" && eccentricLoad
        ? Number(eccentricLoad) : null,
      isometricLoad: modality === "KINEO" && kineoType === "ISOMETRICO" && isometricLoad
        ? Number(isometricLoad) : null,
    };

============================================================
PART 9 -- Exercises List Page
============================================================

STEP 13 -- Update ExercisesPage table:
  File: frontend/src/pages/ExercisesPage.tsx

  a) Add a "Modalidade" column to the table AFTER "Nome" and BEFORE "Descrição":
    - TableHead: "Modalidade"
    - TableCell: render a Badge with the modality value

  b) Use distinct badge styles for each modality:
    - LIVRE: neutral/default style
    - KINEO: orange style (bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800)
    - VALD: green style (bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800)

  c) For Kineo exercises, show the kineo type as a smaller text below or beside the badge.
     Example: Badge "Kineo" followed by a muted span with the type name (e.g., "Isotónico").

  d) Create a helper map for displaying kineo type labels:
    const kineoTypeLabels: Record<string, string> = {
      ISOTONICO: "Isotónico",
      ISOMETRICO: "Isométrico",
      ISOCINETICO: "Isocinético",
      ELASTICO: "Elástico",
      VISCOSO: "Viscoso",
      VLC: "VLC Carga Variável",
    };

============================================================
VERIFICATION
============================================================

After making all changes:

1. Restart the backend: cd backend && ./gradlew bootRun
   - Verify migration V6 runs without errors in the logs
   - Test: curl http://localhost:8080/api/exercises -- should include modality, kineoType, concentricLoad, eccentricLoad, isometricLoad fields
   - All existing exercises should have modality: "LIVRE" and null for kineo fields

2. Start the frontend: cd frontend && npm run dev
   - Verify no compilation errors

3. Test the following flows:

   a) LIVRE exercise (existing behavior):
      - Click "Adicionar Exercício"
      - Modalidade defaults to "Livre"
      - Fill in name, check a parameter, submit -- works as before
      - No Kineo fields visible

   b) KINEO exercise -- Isotónico:
      - Click "Adicionar Exercício"
      - Select Modalidade "Kineo"
      - Kineo sub-section appears with type selector
      - Select "Isotónico" -- concentric and eccentric load fields appear
      - Try to submit without loads -- validation error appears
      - Fill in both loads and submit -- exercise created successfully

   c) KINEO exercise -- Isométrico:
      - Select Modalidade "Kineo"
      - Select "Isométrico" -- only isometric load field appears (NOT concentric/eccentric)
      - Fill in isometric load and submit -- exercise created

   d) VALD exercise:
      - Select Modalidade "Vald"
      - Form is same as Livre -- no Kineo fields
      - Submit -- works as Livre

   e) Edit a Kineo exercise:
      - Click edit on a Kineo exercise
      - All Kineo fields should be pre-populated
      - Change the kineo type -- load fields update accordingly
      - Save changes

   f) Exercises table:
      - All exercises show their modality badge
      - Kineo exercises show the sub-type
      - Livre and Vald exercises show clean badges

IMPORTANT:
- All UI text in Portuguese (pt-PT)
- Do NOT change files in src/components/ui/
- Do NOT break existing functionality -- Livre exercises must work exactly as before
- The backend uses Flyway for migrations -- the new file MUST be named V6__add_exercise_modality.sql
- Run both backend and frontend and confirm no errors before finishing
```
