import { useState } from "react";
import { Pencil, Trash2, Plus, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { useCoachContext } from "@/context/CoachContext";
import {
  useCoaches,
  useCreateCoach,
  useUpdateCoach,
  useDeleteCoach,
} from "@/hooks/useCoaches";
import type { Coach } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function CoachesPage() {
  const { activeCoach, setActiveCoach } = useCoachContext();
  const { data: coaches, isLoading } = useCoaches();

  const createMutation = useCreateCoach();
  const updateMutation = useUpdateCoach();
  const deleteMutation = useDeleteCoach();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [name, setName] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Coach | null>(null);

  const openCreate = () => {
    setEditingCoach(null);
    setName("");
    setFormOpen(true);
  };

  const openEdit = (coach: Coach) => {
    setEditingCoach(coach);
    setName(coach.name);
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCoach) {
      updateMutation.mutate(
        { id: editingCoach.id, name: name.trim() },
        {
          onSuccess: () => {
            toast.success("Treinador atualizado");
            setFormOpen(false);
          },
          onError: () => toast.error("Erro ao atualizar treinador"),
        },
      );
    } else {
      createMutation.mutate(
        { name: name.trim() },
        {
          onSuccess: () => {
            toast.success("Treinador criado");
            setFormOpen(false);
          },
          onError: () => toast.error("Erro ao criar treinador"),
        },
      );
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Treinador eliminado");
        if (activeCoach?.id === deleteTarget.id) {
          setActiveCoach(null);
        }
        setDeleteTarget(null);
      },
      onError: () => toast.error("Erro ao eliminar treinador"),
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-5">
        <div>
          <h1 className="text-2xl font-bold">Treinadores</h1>
          <p className="text-sm text-muted-foreground">
            Gerir perfis de treinadores
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" data-icon="inline-start" />
          Adicionar Treinador
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !coaches?.length ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-24 text-center">
          <Shield className="h-12 w-12 text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-base font-medium">
              Ainda não existem treinadores
            </p>
            <p className="text-sm text-muted-foreground">
              Crie o seu primeiro treinador para começar.
            </p>
          </div>
          <Button variant="outline" onClick={openCreate}>
            <Plus className="h-4 w-4" data-icon="inline-start" />
            Adicionar Treinador
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coaches.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(c)}
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCoach ? "Editar Treinador" : "Adicionar Treinador"}
            </DialogTitle>
            <DialogDescription>
              {editingCoach
                ? "Atualizar nome do treinador."
                : "Criar um novo perfil de treinador."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coach-name">Nome *</Label>
              <Input
                id="coach-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do treinador"
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSaving || !name.trim()}>
                {isSaving && (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    data-icon="inline-start"
                  />
                )}
                {editingCoach ? "Guardar Alterações" : "Criar Treinador"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Treinador</DialogTitle>
            <DialogDescription>
              Tem a certeza que deseja eliminar{" "}
              <span className="font-semibold">{deleteTarget?.name}</span>? Todos
              os atletas, treinos e resultados deste treinador serão eliminados.
              Esta ação não pode ser revertida.
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
