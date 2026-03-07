package com.athletemanager.athlete

import com.athletemanager.coach.CoachRepository
import com.athletemanager.common.exception.ResourceNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class AthleteService(
    private val athleteRepository: AthleteRepository,
    private val coachRepository: CoachRepository
) {

    @Transactional(readOnly = true)
    fun findAll(coachId: UUID?): List<AthleteResponse> {
        val athletes = if (coachId != null) {
            athleteRepository.findByCoachId(coachId)
        } else {
            athleteRepository.findAll()
        }
        return athletes.map { it.toResponse() }
    }

    @Transactional(readOnly = true)
    fun findById(id: UUID): AthleteResponse {
        val athlete = athleteRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Athlete not found with id: $id") }
        return athlete.toResponse()
    }

    fun create(request: CreateAthleteRequest): AthleteResponse {
        val coach = coachRepository.findById(request.coachId)
            .orElseThrow { ResourceNotFoundException("Coach not found with id: ${request.coachId}") }
        val athlete = Athlete(
            name = request.name,
            dateOfBirth = request.dateOfBirth,
            notes = request.notes,
            coach = coach
        )
        return athleteRepository.save(athlete).toResponse()
    }

    fun update(id: UUID, request: CreateAthleteRequest): AthleteResponse {
        val athlete = athleteRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Athlete not found with id: $id") }
        val coach = coachRepository.findById(request.coachId)
            .orElseThrow { ResourceNotFoundException("Coach not found with id: ${request.coachId}") }
        athlete.name = request.name
        athlete.dateOfBirth = request.dateOfBirth
        athlete.notes = request.notes
        athlete.coach = coach
        return athleteRepository.save(athlete).toResponse()
    }

    fun delete(id: UUID) {
        if (!athleteRepository.existsById(id)) {
            throw ResourceNotFoundException("Athlete not found with id: $id")
        }
        athleteRepository.deleteById(id)
    }
}
