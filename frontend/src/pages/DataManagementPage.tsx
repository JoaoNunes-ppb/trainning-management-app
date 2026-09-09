import { useRef, useState } from "react";
import axios from "axios";
import { Download, FileArchive, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { SnapshotSummary } from "@/api/dataTransfer";
import {
  useExportSnapshot,
  useImportSnapshot,
  useValidateSnapshot,
} from "@/hooks/useDataTransfer";
import { useCoachContext } from "@/context/CoachContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const fileLabels: Record<string, string> = {
  "coaches.csv": "Treinadores",
  "athletes.csv": "Atletas",
  "exercises.csv": "Exercícios",
  "workouts.csv": "Treinos",
  "workout_exercises.csv": "Exercícios dos treinos",
  "exercise_results.csv": "Resultados",
};

function errorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "Ocorreu um erro inesperado.";
  const details = error.response?.data?.fieldErrors as
    | Record<string, string>
    | undefined;
  if (details) {
    const [location, message] = Object.entries(details)[0] ?? [];
    if (location && message) return `${location}: ${message}`;
  }
  return error.response?.data?.message ?? "Não foi possível processar o ficheiro.";
}

export default function DataManagementPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { setActiveCoach } = useCoachContext();
  const exportMutation = useExportSnapshot();
  const validateMutation = useValidateSnapshot();
  const importMutation = useImportSnapshot();
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<SnapshotSummary | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync();
      toast.success("Cópia CSV exportada com sucesso.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleFile = async (selected: File | null) => {
    setFile(null);
    setSummary(null);
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".zip")) {
      toast.error("Selecione um ficheiro ZIP exportado pela aplicação.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    try {
      const validated = await validateMutation.mutateAsync(selected);
      setFile(selected);
      setSummary(validated);
      toast.success("Cópia validada. Reveja o conteúdo antes de importar.");
    } catch (error) {
      toast.error(errorMessage(error));
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      await importMutation.mutateAsync(file);
      setActiveCoach(null);
      setConfirmOpen(false);
      setFile(null);
      setSummary(null);
      if (inputRef.current) inputRef.current.value = "";
      toast.success("Dados substituídos com sucesso.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dados e Cópias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Exporte uma cópia portátil ou restaure os dados de uma cópia anterior.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Descarrega um ZIP com ficheiros CSV de treinadores, atletas,
              exercícios, treinos e resultados.
            </p>
            <Button onClick={handleExport} disabled={exportMutation.isPending}>
              {exportMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileArchive className="h-4 w-4" />
              )}
              Descarregar cópia
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A importação valida primeiro todo o ZIP. Só depois de confirmar
              substitui os dados atuais numa única operação.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".zip,application/zip"
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
              disabled={validateMutation.isPending || importMutation.isPending}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
            />
            {validateMutation.isPending && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                A validar a cópia...
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {file && summary && (
        <Card>
          <CardHeader>
            <CardTitle>Cópia validada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><strong>Ficheiro:</strong> {file.name}</p>
              <p><strong>Formato:</strong> versão {summary.formatVersion}</p>
              {Object.entries(summary.files).map(([name, count]) => (
                <p key={name}>
                  <strong>{fileLabels[name] ?? name}:</strong> {count}
                </p>
              ))}
            </div>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              Substituir dados atuais
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            As cópias CSV são manuais e portáteis. As cópias automáticas da
            base de dados continuam a ser necessárias para recuperação em caso
            de falha do servidor.
          </p>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Substituir todos os dados?</DialogTitle>
            <DialogDescription>
              Treinadores, atletas, exercícios, treinos e resultados atuais
              serão substituídos pelo conteúdo de “{file?.name}”. A conta de
              acesso não será alterada. Exporte uma cópia atual antes de continuar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleImport}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar substituição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
