package com.athletemanager.coach

import com.athletemanager.common.exception.ResourceNotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class CoachService(private val coachRepository: CoachRepository) {

    @Transactional(readOnly = true)
    fun findAll(): List<CoachResponse> =
        coachRepository.findAll().map { it.toResponse() }

    @Transactional(readOnly = true)
    fun findById(id: UUID): CoachResponse {
        val coach = coachRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Coach not found with id: $id") }
        return coach.toResponse()
    }

    fun create(request: CreateCoachRequest): CoachResponse {
        val coach = Coach(name = request.name)
        return coachRepository.save(coach).toResponse()
    }

    fun update(id: UUID, request: CreateCoachRequest): CoachResponse {
        val coach = coachRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Coach not found with id: $id") }
        coach.name = request.name
        return coachRepository.save(coach).toResponse()
    }

    fun delete(id: UUID) {
        if (!coachRepository.existsById(id)) {
            throw ResourceNotFoundException("Coach not found with id: $id")
        }
        coachRepository.deleteById(id)
    }
}
