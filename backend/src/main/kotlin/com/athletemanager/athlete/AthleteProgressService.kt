package com.athletemanager.athlete

import com.athletemanager.exerciseresult.ExerciseResultRepository
import com.athletemanager.workout.WorkoutRepository
import com.athletemanager.workoutexercise.WorkoutExerciseRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional(readOnly = true)
class AthleteProgressService(
    private val athleteService: AthleteService,
    private val workoutRepository: WorkoutRepository,
    private val workoutExerciseRepository: WorkoutExerciseRepository,
    private val exerciseResultRepository: ExerciseResultRepository
) {

    fun getProgress(athleteId: UUID, startDate: LocalDate?, endDate: LocalDate?): AthleteProgressResponse {
        val athlete = athleteService.findById(athleteId)

        val workouts = if (startDate != null && endDate != null) {
            workoutRepository.findByAthleteIdAndDateBetween(athleteId, startDate, endDate)
        } else {
            workoutRepository.findByAthleteIdOrderByDateDesc(athleteId)
        }

        val workoutItems = workouts
            .sortedByDescending { it.date }
            .map { workout ->
                val workoutExercises = workoutExerciseRepository.findByWorkoutIdOrderByOrderIndex(workout.id!!)
                val exerciseItems = workoutExercises.map { we ->
                    val result = exerciseResultRepository.findByWorkoutExerciseId(we.id!!)
                    ExerciseProgressItem(
                        exerciseId = we.exercise.id!!,
                        exerciseName = we.exercise.name,
                        setsExpected = we.setsExpected,
                        repsExpected = we.repsExpected,
                        weightExpected = we.weightExpected,
                        distanceExpected = we.distanceExpected,
                        timeExpected = we.timeExpected,
                        setsActual = result?.sets,
                        repsActual = result?.reps,
                        weightActual = result?.weight,
                        distanceActual = result?.distance,
                        timeActual = result?.time,
                        hasResult = result != null
                    )
                }

                WorkoutProgressItem(
                    id = workout.id!!,
                    label = workout.label,
                    date = workout.date,
                    scheduledTime = workout.scheduledTime,
                    status = workout.status,
                    notes = workout.notes,
                    exercises = exerciseItems
                )
            }

        val totalWorkouts = workoutItems.size
        val completedCount = workoutItems.count { it.status == "COMPLETED" }
        val missedCount = workoutItems.count { it.status == "MISSED" }
        val pendingCount = workoutItems.count { it.status == "PENDING" }
        val completionRate = if (totalWorkouts > 0) (completedCount.toDouble() / totalWorkouts) * 100.0 else 0.0

        val stats = ProgressStats(
            totalWorkouts = totalWorkouts,
            completedCount = completedCount,
            missedCount = missedCount,
            pendingCount = pendingCount,
            completionRate = completionRate
        )

        return AthleteProgressResponse(
            athlete = athlete,
            stats = stats,
            workouts = workoutItems
        )
    }
}
