import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkoutForm } from "../WorkoutForm";
import { useAthletes } from "@/hooks/useAthletes";
import { useCreateWorkout } from "@/hooks/useWorkouts";

vi.mock("@/hooks/useAthletes");
vi.mock("@/hooks/useWorkouts");

describe("WorkoutForm", () => {
  it("offers athletes assigned to every coach", async () => {
    vi.mocked(useAthletes).mockReturnValue({
      data: [
        {
          id: "athlete-2",
          name: "Ana",
          coachId: "coach-2",
          coachName: "Treinador B",
          dateOfBirth: null,
          notes: null,
          email: "",
          weightKg: null,
          heightCm: null,
        },
      ],
    } as ReturnType<typeof useAthletes>);
    vi.mocked(useCreateWorkout).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateWorkout>);

    render(<WorkoutForm open onOpenChange={vi.fn()} />);

    expect(await screen.findByText("Criar um treino para qualquer atleta.")).toBeTruthy();
    expect(useAthletes).toHaveBeenCalledWith();
  });
});
