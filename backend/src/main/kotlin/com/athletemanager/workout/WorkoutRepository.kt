package com.athletemanager.workout

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate
import java.util.UUID

interface WorkoutRepository : JpaRepository<Workout, UUID> {
    fun findByDateBetween(start: LocalDate, end: LocalDate): List<Workout>
    fun findByAthleteIdAndDateBetween(athleteId: UUID, start: LocalDate, end: LocalDate): List<Workout>
    fun findByAthlete_Coach_IdAndDateBetween(coachId: UUID, start: LocalDate, end: LocalDate): List<Workout>
    fun findByAthleteIdOrderByDateDesc(athleteId: UUID): List<Workout>
}
