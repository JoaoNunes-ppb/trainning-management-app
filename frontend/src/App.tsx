import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import CalendarPage from "@/pages/CalendarPage";
import AthletesPage from "@/pages/AthletesPage";
import ExercisesPage from "@/pages/ExercisesPage";
import WorkoutDetailPage from "@/pages/WorkoutDetailPage";
import AthleteProgressPage from "@/pages/AthleteProgressPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/athletes/:id" element={<AthleteProgressPage />} />
          <Route path="/athletes" element={<AthletesPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
