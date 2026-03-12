import { useState } from "react";
import { Pencil, Trash2, Plus, Loader2, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { useExercises, useDeleteExercise } from "@/hooks/useExercises";
import type { Exercise } from "@/types";
import { kineoTypeLabels } from "@/lib/exerciseUtils";
import { ExerciseForm } from "@/components/exercise/ExerciseForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

const modalityBadge = (exercise: Exercise) => {
  switch (exercise.modality) {
    case "KINEO":
      return (
        <div className="flex flex-col gap-0.5">
          <Badge variant="secondary" className="bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800">
            Kineo
          </Badge>
          {exercise.kineoType && (
            <span className="text-xs text-muted-foreground">
              {kineoTypeLabels[exercise.kineoType] ?? exercise.kineoType}
            </span>
          )}
        </div>
      );
    case "VALD":
      return (
        <Badge variant="secondary" className="bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800">
          Vald
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          Livre
        </Badge>
      );
  }
};

const parameterBadges: {
  key: keyof Pick<Exercise, "hasSets" | "hasReps" | "hasWeight" | "hasDistance" | "hasTime">;
  label: string;
  className: string;
}[] = [
  { key: "hasSets", label: "Séries", className: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800" },
  { key: "hasReps", label: "Repetições", className: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800" },
  { key: "hasWeight", label: "Peso", className: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800" },
  { key: "hasDistance", label: "Distância", className: "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800" },
  { key: "hasTime", label: "Tempo", className: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800" },
];

export default function ExercisesPage() {
  const { data: exercises, isLoading } = useExercises();
  const deleteMutation = useDeleteExercise();

  const [formOpen, setFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);

  const openCreate = () => {
    setEditingExercise(null);
    setFormOpen(true);
  };

  const openEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Exercício eliminado");
        setDeleteTarget(null);
      },
      onError: () => {
        setDeleteTarget(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-5">
        <div>
          <h1 className="text-2xl font-bold">Exercícios</h1>
          <p className="text-sm text-muted-foreground">
            Gerir a sua biblioteca de exercícios.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" data-icon="inline-start" />
          Adicionar Exercício
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !exercises?.length ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-24 text-center">
          <Dumbbell className="h-12 w-12 text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-base font-medium">Ainda não existem exercícios</p>
            <p className="text-sm text-muted-foreground">
              Crie o seu primeiro exercício para começar.
            </p>
          </div>
          <Button variant="outline" onClick={openCreate}>
            <Plus className="h-4 w-4" data-icon="inline-start" />
            Adicionar Exercício
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Parâmetros</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercises.map((ex) => (
              <TableRow key={ex.id}>
                <TableCell className="font-medium">{ex.name}</TableCell>
                <TableCell>{modalityBadge(ex)}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {ex.description ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {parameterBadges
                      .filter(({ key }) => ex[key])
                      .map(({ key, label, className }) => (
                        <Badge key={key} variant="secondary" className={className}>
                          {label}
                        </Badge>
                      ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(ex)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(ex)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ExerciseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        exercise={editingExercise}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Exercício</DialogTitle>
            <DialogDescription>
              Tem a certeza que deseja eliminar{" "}
              <span className="font-semibold">{deleteTarget?.name}</span>? Esta
              ação não pode ser revertida.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  data-icon="inline-start"
                />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
