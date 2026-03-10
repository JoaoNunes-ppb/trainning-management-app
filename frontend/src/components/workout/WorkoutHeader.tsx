import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { ArrowLeft, Pencil, Trash2, Loader2, Info } from "lucide-react";
import { useUpdateWorkout, useDeleteWorkout, useUpdateWorkoutStatus } from "@/hooks/useWorkouts";
import { useAthletes } from "@/hooks/useAthletes";
import type { WorkoutDetail, WorkoutStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const statusBadgeStyles: Record<WorkoutStatus, string> = {
  PENDING: "",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  MISSED: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<WorkoutStatus, string> = {
  PENDING: "Pendente",
  COMPLETED: "Concluído",
  MISSED: "Falhado",
};

function formatTime(time: string | null) {
  if (!time) return null;
  return time.slice(0, 5);
}

interface WorkoutHeaderProps {
  workout: WorkoutDetail;
  readOnly?: boolean;
}

export function WorkoutHeader({ workout, readOnly = false }: WorkoutHeaderProps) {
  const navigate = useNavigate();
  const updateMutation = useUpdateWorkout();
  const deleteMutation = useDeleteWorkout();
  const statusMutation = useUpdateWorkoutStatus();
  const { data: athletes } = useAthletes(workout.coachId);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");
  const [athleteId, setAthleteId] = useState("");

  const openEdit = () => {
    setLabel(workout.label);
    setDate(workout.date);
    setScheduledTime(workout.scheduledTime ? workout.scheduledTime.slice(0, 5) : "");
    setNotes(workout.notes ?? "");
    setAthleteId(workout.athleteId);
    setEditOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !date || !athleteId) return;
    updateMutation.mutate(
      {
        id: workout.id,
        athleteId,
        label: label.trim(),
        date,
        scheduledTime: scheduledTime ? `${scheduledTime}:00` : undefined,
        notes: notes.trim() || undefined,
      },
      { onSuccess: () => setEditOpen(false) },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(workout.id, {
      onSuccess: () => navigate("/"),
    });
  };

  const handleStatusChange = (status: WorkoutStatus) => {
    if (status === workout.status) return;
    statusMutation.mutate({ id: workout.id, status });
  };

  const formattedTime = formatTime(workout.scheduledTime);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="size-4" data-icon="inline-start" />
            Voltar ao Calendário
          </Button>
        </div>

        {readOnly && (
          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
            <Info className="h-4 w-4 shrink-0" />
            Treino de atleta de outro treinador (apenas leitura)
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{workout.label}</h1>
              <Badge
                variant="outline"
                className={statusBadgeStyles[workout.status]}
              >
                {statusLabels[workout.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(workout.date), "EEEE, MMMM d, yyyy", { locale: pt })}
              {formattedTime && ` às ${formattedTime}`}
            </p>
            <p className="text-sm text-muted-foreground">
              Atleta: <span className="font-medium text-foreground">{workout.athleteName}</span>
              {" \u00b7 "}
              Treinador: <span className="font-medium text-foreground">{workout.coachName}</span>
            </p>
            {workout.notes && (
              <p className="mt-1 text-sm text-muted-foreground italic">
                {workout.notes}
              </p>
            )}
          </div>

          {!readOnly && (
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={openEdit}>
                  <Pencil className="size-3.5" data-icon="inline-start" />
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="size-3.5" data-icon="inline-start" />
                  Eliminar
                </Button>
              </div>
              <div className="flex gap-1">
                {(["PENDING", "COMPLETED", "MISSED"] as WorkoutStatus[]).map((s) => (
                  <Button
                    key={s}
                    variant={workout.status === s ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7 px-2"
                    disabled={statusMutation.isPending}
                    onClick={() => handleStatusChange(s)}
                  >
                    {statusLabels[s]}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Treino</DialogTitle>
            <DialogDescription>Atualizar detalhes do treino.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Atleta *</Label>
              <Select value={athleteId} onValueChange={(v) => setAthleteId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar atleta" />
                </SelectTrigger>
                <SelectContent>
                  {athletes?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-label">Título *</Label>
              <Input
                id="edit-label"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Data *</Label>
              <Input
                id="edit-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-time">Hora</Label>
              <Input
                id="edit-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={updateMutation.isPending || !label.trim() || !date || !athleteId}
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Treino</DialogTitle>
            <DialogDescription>
              Tem a certeza que deseja eliminar "{workout.label}"? Isto irá também remover todos os exercícios
              e resultados. Esta ação não pode ser revertida.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
