import { useState } from "react";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale/pt";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  ChevronUp,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { useCoachContext } from "@/context/CoachContext";
import { useAthletes } from "@/hooks/useAthletes";
import { useAthleteProgress } from "@/hooks/useAthleteProgress";
import type { WorkoutProgressItem, WorkoutStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusConfig: Record<
  WorkoutStatus,
  { label: string; variant: "default" | "destructive" | "outline" }
> = {
  COMPLETED: { label: "Concluído", variant: "default" },
  MISSED: { label: "Falhado", variant: "destructive" },
  PENDING: { label: "Pendente", variant: "outline" },
};

interface MetricDef {
  key: string;
  label: string;
  color: string;
}

const METRICS: MetricDef[] = [
  { key: "weight", label: "Peso (kg)", color: "#8b5cf6" },
  { key: "sets", label: "Séries", color: "#3b82f6" },
  { key: "reps", label: "Repetições", color: "#10b981" },
  { key: "distance", label: "Distância (m)", color: "#f59e0b" },
  { key: "time", label: "Tempo (s)", color: "#ef4444" },
];

interface DataPoint {
  date: string;
  dateLabel: string;
  workoutId: string;
  weight: number | null;
  sets: number | null;
  reps: number | null;
  distance: number | null;
  time: number | null;
}

function getExerciseTimeSeries(
  exerciseId: string,
  allWorkouts: WorkoutProgressItem[],
): DataPoint[] {
  return allWorkouts
    .filter((w) =>
      w.exercises.some((e) => e.exerciseId === exerciseId && e.hasResult),
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((w) => {
      const ex = w.exercises.find((e) => e.exerciseId === exerciseId)!;
      return {
        date: w.date,
        dateLabel: format(parseISO(w.date), "d MMM", { locale: pt }),
        workoutId: w.id,
        weight: ex.weightActual,
        sets: ex.setsActual,
        reps: ex.repsActual,
        distance: ex.distanceActual,
        time: ex.timeActual,
      };
    });
}

function hasMetricData(series: DataPoint[], key: string): boolean {
  return series.some(
    (d) => d[key as keyof DataPoint] !== null && d[key as keyof DataPoint] !== undefined,
  );
}

function ExerciseChart({
  exerciseName,
  exerciseId,
  allWorkouts,
  highlightWorkoutId,
}: {
  exerciseName: string;
  exerciseId: string;
  allWorkouts: WorkoutProgressItem[];
  highlightWorkoutId: string;
}) {
  const series = getExerciseTimeSeries(exerciseId, allWorkouts);
  const availableMetrics = METRICS.filter((m) => hasMetricData(series, m.key));

  if (series.length === 0) {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">{exerciseName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Ainda não existem resultados registados para este exercício.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (availableMetrics.length === 0) return null;

  const highlightPoint = series.find((d) => d.workoutId === highlightWorkoutId);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">{exerciseName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableMetrics.map((metric) => (
            <div key={metric.key} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {metric.label}
              </p>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={series}
                    margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                      allowDecimals={false}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-card)",
                      }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Line
                      type="monotone"
                      dataKey={metric.key}
                      stroke={metric.color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: metric.color }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                    {highlightPoint &&
                      highlightPoint[metric.key as keyof DataPoint] != null && (
                        <ReferenceDot
                          x={highlightPoint.dateLabel}
                          y={
                            highlightPoint[
                              metric.key as keyof DataPoint
                            ] as number
                          }
                          r={7}
                          fill={metric.color}
                          stroke="var(--color-background)"
                          strokeWidth={2}
                        />
                      )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatisticsPage() {
  const { activeCoach } = useCoachContext();
  const { data: athletes, isLoading: athletesLoading } = useAthletes(activeCoach?.id);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

  const selectedAthlete = athletes?.find((a) => a.id === selectedAthleteId) ?? null;
  const { data, isLoading: progressLoading } = useAthleteProgress(selectedAthleteId ?? "");
  const [showProgress, setShowProgress] = useState(false);

  const athleteItems = athletes?.reduce<Record<string, string>>(
    (acc, a) => ({ ...acc, [a.id]: a.name }),
    {},
  ) ?? {};

  if (!activeCoach) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <h2 className="text-xl font-semibold">Nenhum treinador selecionado</h2>
        <p className="text-sm text-muted-foreground">
          Por favor selecione um treinador primeiro
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h1 className="text-2xl font-bold">Estatísticas</h1>
        <p className="text-sm text-muted-foreground">
          Análise de progresso e resultados de treino
        </p>
      </div>

      {/* Athlete selector */}
      <div className="space-y-3">
        <Select
          value={selectedAthleteId}
          onValueChange={(val) => {
            setSelectedAthleteId(val as string);
            setShowProgress(false);
          }}
          items={athleteItems}
        >
          <SelectTrigger className="w-72" disabled={athletesLoading}>
            <SelectValue placeholder="Selecionar atleta..." />
          </SelectTrigger>
          <SelectContent>
            {athletes?.map((athlete) => (
              <SelectItem key={athlete.id} value={athlete.id}>
                {athlete.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Athlete info line */}
        {selectedAthlete && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selectedAthlete.name}</span>
            {selectedAthlete.email && <span>{selectedAthlete.email}</span>}
            {selectedAthlete.weightKg != null && <span>{selectedAthlete.weightKg} kg</span>}
            {selectedAthlete.heightCm != null && <span>{selectedAthlete.heightCm} cm</span>}
            {selectedAthlete.coachName && <span>Treinador: {selectedAthlete.coachName}</span>}
          </div>
        )}
      </div>

      {/* Content */}
      {!selectedAthleteId ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-24 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="text-base font-medium">Selecione um atleta para ver as estatísticas</p>
            <p className="text-sm text-muted-foreground">
              Escolha um atleta no menu acima para visualizar o progresso e resultados de treino.
            </p>
          </div>
        </div>
      ) : progressLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
          <h2 className="text-xl font-semibold">Erro ao carregar progresso</h2>
          <p className="text-sm text-muted-foreground">
            Não foi possível obter os dados de progresso do atleta.
          </p>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card size="sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Treinos
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.stats.totalWorkouts}</p>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
                    Concluídos
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {data.stats.completedCount}
                </p>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <XCircle className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
                    Falhados
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {data.stats.missedCount}
                </p>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Taxa de Conclusão
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {data.stats.totalWorkouts === 0
                    ? "N/D"
                    : `${data.stats.completionRate.toFixed(1)}%`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Workout History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Histórico de Treinos</h2>
              {data.workouts.length > 0 && (
                <Button
                  variant={showProgress ? "secondary" : "outline"}
                  onClick={() => setShowProgress((v) => !v)}
                >
                  {showProgress ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                  {showProgress ? "Ocultar Progresso" : "Ver Progresso"}
                </Button>
              )}
            </div>

            {showProgress && data.workouts.length > 0 && (
              <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                {(() => {
                  const exerciseIds = new Map<string, string>();
                  for (const w of data.workouts) {
                    for (const ex of w.exercises) {
                      if (!exerciseIds.has(ex.exerciseId)) {
                        exerciseIds.set(ex.exerciseId, ex.exerciseName);
                      }
                    }
                  }
                  return Array.from(exerciseIds.entries()).map(([exId, exName]) => (
                    <ExerciseChart
                      key={exId}
                      exerciseName={exName}
                      exerciseId={exId}
                      allWorkouts={data.workouts}
                      highlightWorkoutId=""
                    />
                  ));
                })()}
              </div>
            )}

            {data.workouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-24 text-center">
                <Clock className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Sem treinos ainda</p>
                <p className="text-sm text-muted-foreground">
                  Os treinos deste atleta aparecerão aqui assim que forem agendados.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Designação</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Exercícios</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.workouts.map((w) => {
                    const cfg = statusConfig[w.status];
                    return (
                      <TableRow key={w.id}>
                        <TableCell>
                          {format(parseISO(w.date), "d MMM yyyy", { locale: pt })}
                        </TableCell>
                        <TableCell>
                          {w.scheduledTime
                            ? w.scheduledTime.substring(0, 5)
                            : "—"}
                        </TableCell>
                        <TableCell className="font-medium">{w.label}</TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {w.exercises.length}{" "}
                          {w.exercises.length === 1 ? "exercício" : "exercícios"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
