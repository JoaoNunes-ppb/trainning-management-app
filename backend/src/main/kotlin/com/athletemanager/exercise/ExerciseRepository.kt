package com.athletemanager.exercise

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ExerciseRepository : JpaRepository<Exercise, UUID>
