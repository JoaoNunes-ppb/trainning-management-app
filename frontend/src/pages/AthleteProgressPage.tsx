import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale/pt";
import {
  ArrowLeft,
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

export default function AthleteProgressPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useAthleteProgress(id ?? "");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <h2 className="text-xl font-semibold">Erro ao carregar progresso</h2>
        <p className="text-sm text-muted-foreground">
          Não foi possível obter os dados de progresso do atleta.
        </p>
        <Button variant="outline" onClick={() => navigate("/athletes")}>
          <ArrowLeft className="h-4 w-4" data-icon="inline-start" />
          Voltar aos Atletas
        </Button>
      </div>
    );
  }

  const { athlete, stats, workouts } = data;

  const toggleExpand = (workoutId: string) =>
    setExpandedId((prev) => (prev === workoutId ? null : workoutId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate("/athletes")}
          className="mt-1"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{athlete.name}</h1>
          <p className="text-sm text-muted-foreground">
            {athlete.dateOfBirth && (
              <span>
                Nascido a {format(parseISO(athlete.dateOfBirth), "d 'de' MMMM 'de' yyyy", { locale: pt })}
              </span>
            )}
            {athlete.dateOfBirth && athlete.coachName && <span> · </span>}
            {athlete.coachName && <span>Treinador: {athlete.coachName}</span>}
          </p>
        </div>
      </div>

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
            <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
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
              {stats.completedCount}
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
              {stats.missedCount}
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
              {stats.totalWorkouts === 0
                ? "N/D"
                : `${stats.completionRate.toFixed(1)}%`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workout History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Histórico de Treinos</h2>

        {workouts.length === 0 ? (
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
                <TableHead className="w-20 text-right">Progresso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workouts.map((w) => {
                const cfg = statusConfig[w.status];
                const isExpanded = expandedId === w.id;
                return (
                  <>
                    <TableRow
                      key={w.id}
                      className={isExpanded ? "border-b-0" : undefined}
                    >
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
                      <TableCell className="text-right">
                        <Button
                          variant={isExpanded ? "secondary" : "ghost"}
                          size="icon-sm"
                          onClick={() => toggleExpand(w.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <BarChart3 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`${w.id}-charts`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <div className="space-y-4">
                            {w.exercises.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Sem exercícios neste treino.
                              </p>
                            ) : (
                              w.exercises.map((ex) => (
                                <ExerciseChart
                                  key={ex.exerciseId}
                                  exerciseName={ex.exerciseName}
                                  exerciseId={ex.exerciseId}
                                  allWorkouts={workouts}
                                  highlightWorkoutId={w.id}
                                />
                              ))
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
