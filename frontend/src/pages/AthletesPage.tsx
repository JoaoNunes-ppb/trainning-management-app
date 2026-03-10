import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, Plus, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { useCoachContext } from "@/context/CoachContext";
import {
  useAthletes,
  useCreateAthlete,
  useUpdateAthlete,
  useDeleteAthlete,
} from "@/hooks/useAthletes";
import type { Athlete } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface AthleteFormData {
  name: string;
  dateOfBirth: string;
  notes: string;
}

const emptyForm: AthleteFormData = { name: "", dateOfBirth: "", notes: "" };

export default function AthletesPage() {
  const { activeCoach } = useCoachContext();
  const { data: athletes, isLoading } = useAthletes(activeCoach?.id);

  const createMutation = useCreateAthlete();
  const updateMutation = useUpdateAthlete();
  const deleteMutation = useDeleteAthlete();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [form, setForm] = useState<AthleteFormData>(emptyForm);

  const [deleteTarget, setDeleteTarget] = useState<Athlete | null>(null);

  if (!activeCoach) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <h2 className="text-xl font-semibold">Nenhum treinador selecionado</h2>
        <p className="text-sm text-muted-foreground">
          Por favor selecione um treinador no menu acima para gerir atletas.
        </p>
      </div>
    );
  }

  const openCreate = () => {
    setEditingAthlete(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    setForm({
      name: athlete.name,
      dateOfBirth: athlete.dateOfBirth ?? "",
      notes: athlete.notes ?? "",
    });
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      dateOfBirth: form.dateOfBirth || null,
      coachId: activeCoach.id,
      notes: form.notes.trim() || null,
    };

    if (editingAthlete) {
      updateMutation.mutate(
        { id: editingAthlete.id, ...payload },
        {
          onSuccess: () => {
            toast.success("Atleta atualizado");
            setFormOpen(false);
          },
          onError: () => toast.error("Erro ao atualizar atleta"),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Atleta criado");
          setFormOpen(false);
        },
        onError: () => toast.error("Erro ao criar atleta"),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Atleta eliminado");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Erro ao eliminar atleta"),
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-5">
        <div>
          <h1 className="text-2xl font-bold">Atletas</h1>
          <p className="text-sm text-muted-foreground">
            A gerir atletas de {activeCoach.name}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" data-icon="inline-start" />
          Adicionar Atleta
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !athletes?.length ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-24 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-base font-medium">Ainda não existem atletas</p>
            <p className="text-sm text-muted-foreground">
              Crie o seu primeiro atleta para começar.
            </p>
          </div>
          <Button variant="outline" onClick={openCreate}>
            <Plus className="h-4 w-4" data-icon="inline-start" />
            Adicionar Atleta
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Data de Nascimento</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {athletes.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <Link
                    to={`/athletes/${a.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {a.name}
                  </Link>
                </TableCell>
                <TableCell>{a.dateOfBirth ?? "—"}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {a.notes ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(a)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(a)}
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

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAthlete ? "Editar Atleta" : "Adicionar Atleta"}
            </DialogTitle>
            <DialogDescription>
              {editingAthlete
                ? "Atualizar informações do atleta."
                : "Criar novo atleta para " + activeCoach.name + "."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="athlete-name">Nome *</Label>
              <Input
                id="athlete-name"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Nome do atleta"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="athlete-dob">Data de Nascimento</Label>
              <Input
                id="athlete-dob"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dateOfBirth: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="athlete-notes">Notas</Label>
              <Textarea
                id="athlete-notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Notas opcionais..."
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    data-icon="inline-start"
                  />
                )}
                {editingAthlete ? "Guardar Alterações" : "Criar Atleta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Atleta</DialogTitle>
            <DialogDescription>
              Tem a certeza que deseja eliminar{" "}
              <span className="font-semibold">{deleteTarget?.name}</span>? Isto
              irá também remover todos os treinos e resultados. Esta ação não
              pode ser revertida.
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
