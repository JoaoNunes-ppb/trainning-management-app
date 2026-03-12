import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Exercise, Modality } from "@/types";
import { useCreateExercise, useUpdateExercise } from "@/hooks/useExercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  ParameterToggles,
  type ParameterFlags,
} from "./ParameterToggles";

const defaultFlags: ParameterFlags = {
  hasSets: false,
  hasReps: false,
  hasWeight: false,
  hasDistance: false,
  hasTime: false,
};

interface ExerciseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise?: Exercise | null;
}

export function ExerciseForm({
  open,
  onOpenChange,
  exercise,
}: ExerciseFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [flags, setFlags] = useState<ParameterFlags>(defaultFlags);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [modality, setModality] = useState<Modality>("LIVRE");
  const [kineoType, setKineoType] = useState("");

  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isEdit = !!exercise;

  useEffect(() => {
    if (open) {
      if (exercise) {
        setName(exercise.name);
        setDescription(exercise.description ?? "");
        setFlags({
          hasSets: exercise.hasSets,
          hasReps: exercise.hasReps,
          hasWeight: exercise.hasWeight,
          hasDistance: exercise.hasDistance,
          hasTime: exercise.hasTime,
        });
        setModality(exercise.modality);
        setKineoType(exercise.kineoType ?? "");
      } else {
        setName("");
        setDescription("");
        setFlags(defaultFlags);
        setModality("LIVRE");
        setKineoType("");
      }
      setValidationError(null);
    }
  }, [open, exercise]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const hasAtLeastOne = Object.values(flags).some(Boolean);
    if (!hasAtLeastOne) {
      setValidationError("Pelo menos um parâmetro deve estar ativo.");
      return;
    }

    if (modality === "KINEO" && !kineoType) {
      setValidationError("Tipo Kineo é obrigatório.");
      return;
    }

    setValidationError(null);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      ...flags,
      modality,
      kineoType: modality === "KINEO" ? kineoType : null,
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: exercise.id, ...payload },
        {
          onSuccess: () => {
            toast.success("Exercício atualizado");
            onOpenChange(false);
          },
          onError: () => toast.error("Erro ao atualizar exercício"),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Exercício criado");
          onOpenChange(false);
        },
        onError: () => toast.error("Erro ao criar exercício"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Exercício" : "Adicionar Exercício"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualizar o modelo de exercício."
              : "Criar um novo modelo de exercício."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exercise-name">Nome *</Label>
            <Input
              id="exercise-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do exercício"
            />
          </div>

          <div className="space-y-2">
            <Label>Modalidade *</Label>
            <Select value={modality} onValueChange={(val) => {
              setModality(val as Modality);
              if (val !== "KINEO") {
                setKineoType("");
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

          {modality === "KINEO" && (
            <div className="space-y-2">
              <Label>Tipo Kineo *</Label>
              <Select value={kineoType} onValueChange={(val) => setKineoType(val ?? "")}>
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
          )}

          <div className="space-y-2">
            <Label htmlFor="exercise-desc">Descrição</Label>
            <Textarea
              id="exercise-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional..."
            />
          </div>

          <div className="space-y-2">
            <Label>Parâmetros *</Label>
            <ParameterToggles value={flags} onChange={setFlags} />
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving && (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  data-icon="inline-start"
                />
              )}
              {isEdit ? "Guardar Alterações" : "Criar Exercício"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
