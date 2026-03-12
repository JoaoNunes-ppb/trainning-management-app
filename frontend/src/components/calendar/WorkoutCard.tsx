import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkoutSummary } from "@/types";

const statusStyles: Record<string, string> = {
  COMPLETED: "bg-green-50 border-green-300 dark:bg-green-950/40 dark:border-green-800",
  MISSED: "bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-800",
  PENDING: "",
};

const statusLeftBorder: Record<string, string> = {
  COMPLETED: "border-l-[3px] border-l-green-500",
  MISSED: "border-l-[3px] border-l-red-500",
  PENDING: "border-l-[3px] border-l-primary",
};

interface WorkoutCardProps {
  workout: WorkoutSummary;
  isOwner?: boolean;
}

function formatTime(time: string | null) {
  if (!time) return null;
  return time.slice(0, 5);
}

export default function WorkoutCard({ workout, isOwner = true }: WorkoutCardProps) {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("workoutId", workout.id);
    e.dataTransfer.setData("sourceDate", workout.date);
    e.dataTransfer.effectAllowed = "copy";
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Card
      size="sm"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 ${statusStyles[workout.status] ?? ""} ${statusLeftBorder[workout.status] ?? ""} ${!isOwner ? "opacity-50 border-dashed" : ""} ${isDragging ? "opacity-40" : ""}`}
      onClick={() => navigate(`/workouts/${workout.id}`)}
      title={!isOwner ? "Treino de outro treinador" : undefined}
    >
      <CardContent className="space-y-1 p-2">
        <div className="flex items-start justify-between gap-1">
          <p className="truncate text-sm font-semibold leading-tight">
            {workout.label}
          </p>
          {workout.status === "COMPLETED" && (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
          )}
          {workout.status === "MISSED" && (
            <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
          )}
          {workout.status === "PENDING" && workout.scheduledTime && (
            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {workout.athleteName}
        </p>
        {workout.scheduledTime && (
          <p className="text-[10px] text-muted-foreground">
            {formatTime(workout.scheduledTime)}
          </p>
        )}
        {workout.exerciseCount > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {workout.exerciseCount} exercício{workout.exerciseCount !== 1 && "s"}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
