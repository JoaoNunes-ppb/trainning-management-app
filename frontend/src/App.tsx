import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import CalendarPage from "@/pages/CalendarPage";
import CoachesPage from "@/pages/CoachesPage";
import AthletesPage from "@/pages/AthletesPage";
import ExercisesPage from "@/pages/ExercisesPage";
import WorkoutDetailPage from "@/pages/WorkoutDetailPage";
import StatisticsPage from "@/pages/StatisticsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/coaches" element={<CoachesPage />} />
          <Route path="/athletes" element={<AthletesPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/estatisticas" element={<StatisticsPage />} />
          <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
