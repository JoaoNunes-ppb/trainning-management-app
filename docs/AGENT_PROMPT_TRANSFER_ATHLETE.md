# Agent Prompt -- Transfer Athlete to Another Coach

Copy-paste this prompt into a new Cursor Agent chat.

**Attach:** `@docs/PRD.md` `@docs/FRONTEND_ARCHITECTURE.md` `@frontend/src/pages/AthletesPage.tsx` `@frontend/src/hooks/useCoaches.ts`

---

```
You are improving the frontend of an Athlete Management App.

You have full access to run any shell commands (npm, etc.) inside /Users/nunesj/trainning-management-app.

The frontend is in frontend/. The backend is running at http://localhost:8080 and already fully supports changing an athlete's coach via PUT /api/athletes/{id} with a different coachId. NO backend changes are needed.

Read the attached files to understand the current code.

YOUR TASK: Allow transferring an athlete to a different coach via the edit form.

============================================================
CHANGES -- AthletesPage.tsx
============================================================

All changes are in a single file: frontend/src/pages/AthletesPage.tsx

STEP 1 -- Import useCoaches hook:
  Add to imports:
    import { useCoaches } from "@/hooks/useCoaches";

STEP 2 -- Add coachId to form state:
  Update the AthleteFormData interface:
    - Add: coachId: string

  Update emptyForm:
    - Add: coachId: ""

STEP 3 -- Fetch coaches:
  Inside the AthletesPage component, add:
    const { data: coaches } = useCoaches();

STEP 4 -- Update openCreate:
  When opening the create form, set coachId to activeCoach.id:
    setForm({ ...emptyForm, coachId: activeCoach.id });

STEP 5 -- Update openEdit:
  When opening the edit form, populate coachId from the athlete:
    coachId: athlete.coachId,

STEP 6 -- Add "Treinador" field to the form dialog:
  Add a new field at the END of the form (after the last existing field, before DialogFooter).

  The field should behave differently for create vs edit:

  a) When CREATING (editingAthlete is null):
     - Show a read-only display (NOT a dropdown):
       <div className="space-y-2">
         <Label>Treinador</Label>
         <p className="text-sm text-muted-foreground">{activeCoach.name}</p>
       </div>
     - The coachId is always activeCoach.id (already set in STEP 4)

  b) When EDITING (editingAthlete is not null):
     - Show a Select dropdown with ALL coaches:
       <div className="space-y-2">
         <Label htmlFor="athlete-coach">Treinador</Label>
         <Select
           value={form.coachId}
           onValueChange={(val) => setForm((f) => ({ ...f, coachId: val }))}
         >
           <SelectTrigger id="athlete-coach">
             <SelectValue placeholder="Selecionar treinador..." />
           </SelectTrigger>
           <SelectContent>
             {coaches?.map((c) => (
               <SelectItem key={c.id} value={c.id}>
                 {c.name}
               </SelectItem>
             ))}
           </SelectContent>
         </Select>
       </div>

     - If the selected coachId is DIFFERENT from the athlete's original coachId (editingAthlete.coachId), show a warning below the dropdown:
       <p className="text-sm text-amber-600 dark:text-amber-400">
         ⚠ Ao guardar, este atleta será transferido para o treinador selecionado e deixará de aparecer na sua lista.
       </p>

STEP 7 -- Update handleSubmit payload:
  Change the payload to use form.coachId instead of always using activeCoach.id:

  const payload = {
    name: form.name.trim(),
    dateOfBirth: form.dateOfBirth || null,
    coachId: form.coachId,
    notes: form.notes.trim() || null,
  };

  NOTE: If the previous AGENT_PROMPT_ATHLETE_STATS.md prompt has already been run, there will also be email, weightKg, heightCm fields in the payload. Keep those -- only change the coachId line.

STEP 8 -- Update toast message for transfer:
  In the updateMutation onSuccess callback, check if the coach changed:
    onSuccess: () => {
      const transferred = editingAthlete && form.coachId !== editingAthlete.coachId;
      toast.success(transferred ? "Atleta transferido com sucesso" : "Atleta atualizado");
      setFormOpen(false);
    },

STEP 9 -- Make sure Select is imported:
  Verify that Select, SelectContent, SelectItem, SelectTrigger, SelectValue are imported from "@/components/ui/select". If not already imported, add the import.

============================================================
VERIFICATION
============================================================

After making all changes, run: cd frontend && npm run dev

Test the following flow:
1. Open http://localhost:5173
2. Select "Coach Nunes" from the top bar
3. Go to /athletes -- see the athletes list
4. Click edit (pencil) on an athlete -- the form opens with a "Treinador" dropdown showing the current coach
5. Change the coach to "Coach Pires" -- the amber warning appears
6. Click "Guardar Alterações" -- toast says "Atleta transferido com sucesso"
7. The athlete disappears from the list (it now belongs to Coach Pires)
8. Switch to "Coach Pires" in the top bar -- the transferred athlete appears in their list
9. Click "Adicionar Atleta" -- the form shows the coach name as read-only text (no dropdown)
10. Create a new athlete -- it is assigned to the active coach as before

IMPORTANT:
- All UI text in Portuguese (pt-PT)
- Do NOT change any backend code
- Do NOT change files in src/components/ui/
- Do NOT break existing functionality
- Run npm run dev and confirm no compilation errors before finishing
```
