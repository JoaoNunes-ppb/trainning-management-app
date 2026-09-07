package com.athletemanager.coach

import com.athletemanager.common.exception.ResourceNotFoundException
import com.athletemanager.config.AuditEventLogger
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class CoachService(
    private val coachRepository: CoachRepository,
    private val auditEventLogger: AuditEventLogger
) {

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
        val saved = coachRepository.save(coach)
        auditEventLogger.logEvent("CREATE", "Coach", saved.id, "name=${saved.name}")
        return saved.toResponse()
    }

    fun update(id: UUID, request: CreateCoachRequest): CoachResponse {
        val coach = coachRepository.findById(id)
            .orElseThrow { ResourceNotFoundException("Coach not found with id: $id") }
        coach.name = request.name
        val saved = coachRepository.save(coach)
        auditEventLogger.logEvent("UPDATE", "Coach", saved.id, "name=${saved.name}")
        return saved.toResponse()
    }

    fun delete(id: UUID) {
        if (!coachRepository.existsById(id)) {
            throw ResourceNotFoundException("Coach not found with id: $id")
        }
        coachRepository.deleteById(id)
        auditEventLogger.logEvent("DELETE", "Coach", id)
    }
}
