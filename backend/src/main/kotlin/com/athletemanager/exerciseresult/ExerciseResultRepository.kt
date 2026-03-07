package com.athletemanager.exerciseresult

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ExerciseResultRepository : JpaRepository<ExerciseResult, UUID> {
    fun findByWorkoutExerciseId(workoutExerciseId: UUID): ExerciseResult?
}
