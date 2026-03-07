package com.athletemanager.athlete

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface AthleteRepository : JpaRepository<Athlete, UUID> {
    fun findByCoachId(coachId: UUID): List<Athlete>
}
