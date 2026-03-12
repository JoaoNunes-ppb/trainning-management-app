# Modalidade de Exercício

## Contexto

Cada exercício passa a ter uma **Modalidade** (`LIVRE`, `KINEO` ou `VALD`) que determina os campos disponíveis e obrigatórios no formulário de criação/edição.

- **Livre** — comportamento atual (nome, descrição, parâmetros booleanos).
- **Vald** — mantém os mesmos campos que o Livre.
- **Kineo** — introduz um tipo obrigatório e campos de carga condicionais.

---

## Regras de Negócio — Kineo

Quando a modalidade é `KINEO`, o utilizador deve selecionar um **Tipo Kineo** obrigatório. Consoante o tipo, surgem campos de carga obrigatórios:

| Tipo Kineo         | Campos Obrigatórios                                  |
| ------------------ | ---------------------------------------------------- |
| Isotónico          | Carga Concêntrica (Kg) + Carga Excêntrica (Kg)      |
| Isométrico         | Carga Isométrica (Kg)                                |
| Isocinético        | Carga Concêntrica (Kg) + Carga Excêntrica (Kg)      |
| Elástico           | Carga Concêntrica (Kg) + Carga Excêntrica (Kg)      |
| Viscoso            | Carga Concêntrica (Kg) + Carga Excêntrica (Kg)      |
| VLC Carga Variável | Carga Concêntrica (Kg) + Carga Excêntrica (Kg)      |

---

## Modelo de Dados

### Novos campos na tabela `exercise`

| Coluna            | Tipo            | Restrições                    |
| ----------------- | --------------- | ----------------------------- |
| `modality`        | VARCHAR(10)     | NOT NULL, DEFAULT `'LIVRE'`   |
| `kineo_type`      | VARCHAR(30)     | Nullable                      |
| `concentric_load` | NUMERIC(10,2)   | Nullable                      |
| `eccentric_load`  | NUMERIC(10,2)   | Nullable                      |
| `isometric_load`  | NUMERIC(10,2)   | Nullable                      |

### Valores válidos

- **modality:** `LIVRE`, `KINEO`, `VALD`
- **kineo_type:** `ISOTONICO`, `ISOMETRICO`, `ISOCINETICO`, `ELASTICO`, `VISCOSO`, `VLC`

Os exercícios existentes ficam como `LIVRE` por defeito (via DEFAULT na migração).

---

## Migração (Flyway)

Ficheiro: `V6__add_exercise_modality.sql`

```sql
ALTER TABLE exercise
  ADD COLUMN modality VARCHAR(10) NOT NULL DEFAULT 'LIVRE',
  ADD COLUMN kineo_type VARCHAR(30),
  ADD COLUMN concentric_load NUMERIC(10,2),
  ADD COLUMN eccentric_load NUMERIC(10,2),
  ADD COLUMN isometric_load NUMERIC(10,2);
```

---

## Backend (Kotlin / Spring Boot)

### Enums

Criar `ExerciseEnums.kt` no pacote `exercise`:

```kotlin
enum class Modality { LIVRE, KINEO, VALD }
enum class KineoType { ISOTONICO, ISOMETRICO, ISOCINETICO, ELASTICO, VISCOSO, VLC }
```

### Entidade — `Exercise.kt`

Adicionar:

```kotlin
@Enumerated(EnumType.STRING)
@Column(nullable = false)
var modality: Modality = Modality.LIVRE

@Enumerated(EnumType.STRING)
@Column(name = "kineo_type")
var kineoType: KineoType? = null

@Column(name = "concentric_load")
var concentricLoad: Double? = null

@Column(name = "eccentric_load")
var eccentricLoad: Double? = null

@Column(name = "isometric_load")
var isometricLoad: Double? = null
```

### DTOs — `ExerciseDto.kt`

Adicionar os mesmos 5 campos a `CreateExerciseRequest`, `ExerciseResponse` e ao mapper `toResponse()`.

### Validação — `ExerciseService.kt`

No `create` e `update`:

- Se `modality == KINEO`:
  - `kineoType` é obrigatório.
  - Se `kineoType == ISOMETRICO`: `isometricLoad` obrigatório.
  - Caso contrário: `concentricLoad` e `eccentricLoad` obrigatórios.
- Se `modality != KINEO`: ignorar/limpar campos Kineo.

---

## Frontend (React / TypeScript)

### Tipos — `types/index.ts`

```typescript
export type Modality = "LIVRE" | "KINEO" | "VALD";
export type KineoType = "ISOTONICO" | "ISOMETRICO" | "ISOCINETICO" | "ELASTICO" | "VISCOSO" | "VLC";
```

Adicionar à interface `Exercise`:

```typescript
modality: Modality;
kineoType: KineoType | null;
concentricLoad: number | null;
eccentricLoad: number | null;
isometricLoad: number | null;
```

### API — `api/exercises.ts`

Adicionar os novos campos a `ExercisePayload`.

### Formulário — `ExerciseForm.tsx`

Fluxo condicional:

1. Select **Modalidade** (Livre | Kineo | Vald) — logo após o campo Nome.
2. Se **Livre** ou **Vald**: formulário atual sem alterações.
3. Se **Kineo**: mostrar secção adicional:
   - Select **Tipo Kineo** (Isotónico, Isométrico, Isocinético, Elástico, Viscoso, VLC Carga Variável).
   - Se Isométrico: campo numérico "Carga Isométrica (Kg)".
   - Caso contrário: campos numéricos "Carga Concêntrica (Kg)" + "Carga Excêntrica (Kg)".
   - Validação client-side: campos de carga obrigatórios quando Kineo selecionado.

### Listagem — `ExercisesPage.tsx`

- Adicionar coluna "Modalidade" na tabela com badge colorido.
- Opcionalmente mostrar tipo Kineo e valores de carga como informação secundária.

---

## Ficheiros a Alterar

**Backend (novos):**
- `backend/src/main/resources/db/migration/V6__add_exercise_modality.sql`
- `backend/src/main/kotlin/com/athletemanager/exercise/ExerciseEnums.kt`

**Backend (existentes):**
- `backend/src/main/kotlin/com/athletemanager/exercise/Exercise.kt`
- `backend/src/main/kotlin/com/athletemanager/exercise/ExerciseDto.kt`
- `backend/src/main/kotlin/com/athletemanager/exercise/ExerciseService.kt`

**Frontend (existentes):**
- `frontend/src/types/index.ts`
- `frontend/src/api/exercises.ts`
- `frontend/src/components/exercise/ExerciseForm.tsx`
- `frontend/src/pages/ExercisesPage.tsx`

---

## Impacto em Componentes de Treino

Os componentes de workout (`AddExerciseDialog`, `WorkoutExerciseItem`, etc.) usam o exercício apenas para ler os parâmetros booleanos (`hasSets`, `hasReps`, etc.). Os novos campos Kineo são propriedades do exercício em si, não do workout-exercise. Não é necessário alterar estes componentes nesta fase.
