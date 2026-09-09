import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import CalendarPage from "@/pages/CalendarPage";
import CoachesPage from "@/pages/CoachesPage";
import AthletesPage from "@/pages/AthletesPage";
import ExercisesPage from "@/pages/ExercisesPage";
import WorkoutDetailPage from "@/pages/WorkoutDetailPage";
import StatisticsPage from "@/pages/StatisticsPage";
import LoginPage from "@/pages/LoginPage";
import DataManagementPage from "@/pages/DataManagementPage";
import { Loader2 } from "lucide-react";

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<CalendarPage />} />
            <Route path="/coaches" element={<CoachesPage />} />
            <Route path="/athletes" element={<AthletesPage />} />
            <Route path="/exercises" element={<ExercisesPage />} />
            <Route path="/estatisticas" element={<StatisticsPage />} />
            <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
            <Route path="/dados" element={<DataManagementPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
