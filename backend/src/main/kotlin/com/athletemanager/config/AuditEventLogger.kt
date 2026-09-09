package com.athletemanager.config

import org.slf4j.LoggerFactory
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class AuditEventLogger {

    private val auditLog = LoggerFactory.getLogger("AUDIT")

    fun logEvent(action: String, entityType: String, entityId: UUID? = null, details: String? = null) {
        val username = SecurityContextHolder.getContext().authentication?.name ?: "system"

        val message = buildString {
            append("action=$action entityType=$entityType")
            if (entityId != null) append(" entityId=$entityId")
            append(" user=$username")
            if (details != null) append(" details=$details")
        }

        auditLog.info(message)
    }
}
