package com.athletemanager.workoutexercise

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface WorkoutExerciseRepository : JpaRepository<WorkoutExercise, UUID> {
    fun findByWorkoutIdOrderByOrderIndex(workoutId: UUID): List<WorkoutExercise>
    fun countByExerciseId(exerciseId: UUID): Long
}
