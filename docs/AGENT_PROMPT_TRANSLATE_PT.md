# Agent Prompt -- Translate Frontend to Portuguese (pt-PT)

Copy-paste this prompt into a new Cursor Agent chat.

**Attach:** `@docs/FRONTEND_ARCHITECTURE.md` `@frontend/src`

---

```
You are translating the frontend of an Athlete Management App from English to Portuguese (Portugal - pt-PT).

You have full access to run any shell commands (npm, etc.) inside /Users/nunesj/trainning-management-app.

The frontend is fully built and working in frontend/. Your job is to go through EVERY .tsx and .ts file in frontend/src/ (excluding files in components/ui/) and replace ALL user-facing English text with Portuguese (pt-PT).

Read section 8 of the attached FRONTEND_ARCHITECTURE.md for the official translation table.

RULES:
- ONLY change user-facing strings (labels, headings, buttons, placeholders, toasts, empty states, confirmations, tooltips).
- Do NOT change: variable names, function names, type names, import paths, CSS classes, API paths, JSON field names, or developer-facing error messages.
- Do NOT change any file in frontend/src/components/ui/ (those are shadcn/ui library files).
- Do NOT change any logic or functionality. Only swap English strings for Portuguese.
- Use date-fns Portuguese locale (pt) for date formatting where applicable.

HERE IS THE COMPLETE TRANSLATION TO APPLY, FILE BY FILE:

===== src/components/layout/AppLayout.tsx =====
- "Athlete Manager" -> "Gestão de Atletas" (all occurrences: desktop sidebar, mobile sidebar, mobile header)
- "Calendar" -> "Calendário"
- "Athletes" -> "Atletas"
- "Exercises" -> "Exercícios"
- "Training Management v2.0" -> "Gestão de Treinos v2.0"
- "Select a coach..." -> "Selecionar treinador..."

===== src/pages/CalendarPage.tsx =====
- "Day" -> "Dia"
- "Week" -> "Semana"
- "Month" -> "Mês"

===== src/pages/AthletesPage.tsx =====
- "No coach selected" -> "Nenhum treinador selecionado"
- "Please select a coach from the dropdown above to manage athletes." -> "Por favor selecione um treinador no menu acima para gerir atletas."
- "Athlete updated" -> "Atleta atualizado"
- "Failed to update athlete" -> "Erro ao atualizar atleta"
- "Athlete created" -> "Atleta criado"
- "Failed to create athlete" -> "Erro ao criar atleta"
- "Athlete deleted" -> "Atleta eliminado"
- "Failed to delete athlete" -> "Erro ao eliminar atleta"
- "Athletes" (page heading) -> "Atletas"
- "Managing athletes for " -> "A gerir atletas de "
- "Add Athlete" -> "Adicionar Atleta" (all occurrences)
- "No athletes yet" -> "Ainda não existem atletas"
- "Create your first athlete to get started." -> "Crie o seu primeiro atleta para começar."
- "Name" (table header) -> "Nome"
- "Date of Birth" (table header) -> "Data de Nascimento"
- "Notes" (table header and form label) -> "Notas"
- "Actions" (table header) -> "Ações"
- "Edit Athlete" -> "Editar Atleta"
- "Update athlete information." -> "Atualizar informações do atleta."
- "Create a new athlete for " -> "Criar novo atleta para "
- "Name *" -> "Nome *"
- "Athlete name" (placeholder) -> "Nome do atleta"
- "Date of Birth" (form label) -> "Data de Nascimento"
- "Optional notes..." -> "Notas opcionais..."
- "Save Changes" -> "Guardar Alterações"
- "Create Athlete" -> "Criar Atleta"
- "Delete Athlete" -> "Eliminar Atleta"
- "Are you sure you want to delete " -> "Tem a certeza que deseja eliminar "
- "? This will also remove all their workouts and results. This action cannot be undone." -> "? Isto irá também remover todos os treinos e resultados. Esta ação não pode ser revertida."
- "Cancel" -> "Cancelar"
- "Delete" -> "Eliminar"

===== src/pages/ExercisesPage.tsx =====
- "Sets" (badge) -> "Séries"
- "Reps" (badge) -> "Repetições"
- "Weight" (badge) -> "Peso"
- "Distance" (badge) -> "Distância"
- "Time" (badge) -> "Tempo"
- "Exercise deleted" -> "Exercício eliminado"
- "Exercises" (heading) -> "Exercícios"
- "Manage your exercise template library." -> "Gerir a sua biblioteca de exercícios."
- "Add Exercise" -> "Adicionar Exercício" (all occurrences)
- "No exercises yet" -> "Ainda não existem exercícios"
- "Create your first exercise template to get started." -> "Crie o seu primeiro exercício para começar."
- "Name" (table header) -> "Nome"
- "Description" (table header) -> "Descrição"
- "Parameters" (table header) -> "Parâmetros"
- "Actions" (table header) -> "Ações"
- "Delete Exercise" -> "Eliminar Exercício"
- "Are you sure you want to delete " -> "Tem a certeza que deseja eliminar "
- "? This action cannot be undone." -> "? Esta ação não pode ser revertida."
- "Cancel" -> "Cancelar"
- "Delete" -> "Eliminar"

===== src/pages/WorkoutDetailPage.tsx =====
- "Workout not found" -> "Treino não encontrado"
- "The workout you're looking for doesn't exist or has been deleted." -> "O treino que procura não existe ou foi eliminado."

===== src/components/calendar/CalendarHeader.tsx =====
- "Today" -> "Hoje"

===== src/components/calendar/CalendarFilterBar.tsx =====
- "All Athletes" -> "Todos os Atletas"
- "By Coach" -> "Por Treinador"
- "By Athlete" -> "Por Atleta"
- "Select coach..." -> "Selecionar treinador..."
- "Select athlete..." -> "Selecionar atleta..."

===== src/components/calendar/WorkoutCard.tsx =====
- " exercise" / " exercises" -> " exercício" / " exercícios"

===== src/components/calendar/DayColumn.tsx =====
- If day names are hardcoded, use: Seg, Ter, Qua, Qui, Sex, Sáb, Dom
- If using date-fns format for day names, add the pt locale:
  import { pt } from "date-fns/locale";
  format(date, "EEE", { locale: pt })

===== src/components/calendar/WeeklyCalendar.tsx =====
- "New Workout" -> "Novo Treino"

===== src/components/calendar/MonthlyCalendar.tsx =====
- ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] -> ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
- "Today" -> "Hoje"
- "+{n} more" -> "+{n} mais"
- "{n} workout" / "{n} workouts" -> "{n} treino" / "{n} treinos"

===== src/components/calendar/DailyCalendar.tsx =====
- "Today" -> "Hoje"
- "(Today)" -> "(Hoje)"
- "New Workout" -> "Novo Treino"
- "Unscheduled" -> "Sem horário"
- "No unscheduled workouts" -> "Sem treinos por agendar"
- "Schedule" -> "Horário"

===== src/components/workout/WorkoutForm.tsx =====
- "New Workout" -> "Novo Treino" (all occurrences)
- "Select a coach first using the dropdown in the top bar." -> "Selecione primeiro um treinador no menu superior."
- "Create a workout for one of your athletes." -> "Criar um treino para um dos seus atletas."
- "Athlete *" -> "Atleta *"
- "Select an athlete" -> "Selecionar atleta"
- "Label *" -> "Título *"
- "e.g. Upper Body Strength" -> "ex. Treino de Força Superior"
- "Date *" -> "Data *"
- "Time" -> "Hora"
- "Notes" -> "Notas"
- "Optional notes..." -> "Notas opcionais..."
- "Create Workout" -> "Criar Treino"

===== src/components/workout/WorkoutHeader.tsx =====
- "Pending" -> "Pendente"
- "Completed" -> "Concluído"
- "Missed" -> "Falhado"
- "Back to Calendar" -> "Voltar ao Calendário"
- " at " -> " às "
- "Athlete: " -> "Atleta: "
- "Coach: " -> "Treinador: "
- "Edit" -> "Editar"
- "Delete" -> "Eliminar"
- "Edit Workout" -> "Editar Treino"
- "Update workout details." -> "Atualizar detalhes do treino."
- "Athlete *" -> "Atleta *"
- "Select an athlete" -> "Selecionar atleta"
- "Label *" -> "Título *"
- "Date *" -> "Data *"
- "Time" -> "Hora"
- "Notes" -> "Notas"
- "Save Changes" -> "Guardar Alterações"
- "Delete Workout" -> "Eliminar Treino"
- "Are you sure you want to delete \"" -> "Tem a certeza que deseja eliminar \""
- "\"? This will also remove all exercises and results. This action cannot be undone." -> "\"? Isto irá também remover todos os exercícios e resultados. Esta ação não pode ser revertida."
- "Cancel" -> "Cancelar"

===== src/components/workout/WorkoutExerciseItem.tsx =====
- " sets" -> " séries"
- " reps" -> " reps"
- " kg" -> " kg" (keep as is)
- " m" -> " m" (keep as is)
- " s" -> " s" (keep as is)
- "No targets set" -> "Sem objetivos definidos"
- "Expected:" -> "Previsto:"
- "Actual:" -> "Realizado:"
- "Edit " (dialog title prefix) -> "Editar "
- "Update expected values and notes." -> "Atualizar valores previstos e notas."
- "Sets" (form label) -> "Séries"
- "Reps" (form label) -> "Repetições"
- "Weight (kg)" (form label) -> "Peso (kg)"
- "Distance (m)" (form label) -> "Distância (m)"
- "Time (s)" (form label) -> "Tempo (s)"
- "Notes" (form label) -> "Notas"
- "Save Changes" -> "Guardar Alterações"
- "Remove Exercise" -> "Remover Exercício"
- "Remove \"" -> "Remover \""
- "\" from this workout? Any logged results will also be deleted." -> "\" deste treino? Os resultados registados também serão eliminados."
- "Cancel" -> "Cancelar"
- "Remove" -> "Remover"

===== src/components/workout/WorkoutExerciseList.tsx =====
- "Exercises" (section heading) -> "Exercícios"
- "Add Exercise" -> "Adicionar Exercício"
- "No exercises yet. Add one to get started." -> "Ainda não existem exercícios. Adicione um para começar."

===== src/components/workout/AddExerciseDialog.tsx =====
- "Add Exercise" (title and button) -> "Adicionar Exercício"
- "Select an exercise from the library and set expected values." -> "Selecione um exercício da biblioteca e defina os valores previstos."
- "Exercise *" -> "Exercício *"
- "Select an exercise" -> "Selecionar exercício"
- "Sets" -> "Séries"
- "Reps" -> "Repetições"
- "Weight (kg)" -> "Peso (kg)"
- "Distance (m)" -> "Distância (m)"
- "Time (s)" -> "Tempo (s)"
- "e.g. 3", "e.g. 10", "e.g. 80", "e.g. 5000", "e.g. 120" -> "ex. 3", "ex. 10", "ex. 80", "ex. 5000", "ex. 120"
- "Notes" -> "Notas"
- "Optional notes..." -> "Notas opcionais..."

===== src/components/exercise/ExerciseForm.tsx =====
- "At least one parameter must be enabled." -> "Pelo menos um parâmetro deve estar ativo."
- "Exercise updated" -> "Exercício atualizado"
- "Failed to update exercise" -> "Erro ao atualizar exercício"
- "Exercise created" -> "Exercício criado"
- "Failed to create exercise" -> "Erro ao criar exercício"
- "Edit Exercise" -> "Editar Exercício"
- "Add Exercise" -> "Adicionar Exercício"
- "Update the exercise template." -> "Atualizar o modelo de exercício."
- "Create a new exercise template." -> "Criar um novo modelo de exercício."
- "Name *" -> "Nome *"
- "Exercise name" (placeholder) -> "Nome do exercício"
- "Description" -> "Descrição"
- "Optional description..." -> "Descrição opcional..."
- "Parameters *" -> "Parâmetros *"
- "Save Changes" -> "Guardar Alterações"
- "Create Exercise" -> "Criar Exercício"

===== src/components/exercise/ParameterToggles.tsx =====
- "Sets" -> "Séries"
- "Reps" -> "Repetições"
- "Weight (kg)" -> "Peso (kg)"
- "Distance (m)" -> "Distância (m)"
- "Time (s)" -> "Tempo (s)"

===== src/components/result/ResultLogger.tsx =====
- "Edit Results" -> "Editar Resultados"
- "Log Results" -> "Registar Resultados"
- "Actual Sets" -> "Séries Realizadas"
- "Actual Reps" -> "Repetições Realizadas"
- "Actual Weight (kg)" -> "Peso Realizado (kg)"
- "Actual Distance (m)" -> "Distância Realizada (m)"
- "Actual Time (s)" -> "Tempo Realizado (s)"
- "Notes" -> "Notas"
- "Save" -> "Guardar"
- "Cancel" -> "Cancelar"
- "Clear Results" (button and dialog title) -> "Limpar Resultados"
- "Remove logged results for \"" -> "Remover resultados registados de \""
- "\"? This cannot be undone." -> "\"? Esta ação não pode ser revertida."
- "Clear" -> "Limpar"

===== src/lib/dateUtils.ts =====
- Add the Portuguese locale import and use it in any user-facing date formatting:
  import { pt } from "date-fns/locale";
- If formatDisplayDate uses format(), pass { locale: pt } as option.

===== ALSO: install date-fns locale if not already available =====
The pt locale is included in date-fns by default, just needs to be imported.

===== VERIFICATION =====
After making all changes, run:
  cd frontend && npm run dev

Open http://localhost:5173 and verify:
- Sidebar shows: Calendário, Atletas, Exercícios
- Top bar shows: Gestão de Atletas, "Selecionar treinador..."
- Calendar buttons: Hoje, Todos os Atletas, Por Treinador, Por Atleta
- Calendar day headers: Seg, Ter, Qua, Qui, Sex, Sáb, Dom
- Athletes page: all labels, buttons, toasts in Portuguese
- Exercises page: parameter badges say Séries, Repetições, Peso, Distância, Tempo
- Workout detail: Previsto/Realizado labels, Registar Resultados button
- All dialogs, confirmations, and toasts in Portuguese
- No English text remaining in the UI

IMPORTANT:
- Do NOT change code logic, variable names, type names, or API calls.
- Do NOT modify files in src/components/ui/.
- Only replace string literals. Do not restructure any component.
- If a string appears multiple times in a file, translate ALL occurrences.
- Run npm run dev and confirm there are no compilation errors before finishing.
```
