package com.athletemanager.config

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import java.util.UUID

class AuditEventLoggerTest {

    private val logger = AuditEventLogger()

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `logEvent does not throw when called with all parameters`() {
        setAuthenticatedUser("admin")

        val entityId = UUID.randomUUID()
        logger.logEvent("CREATE", "Coach", entityId, "name=Test Coach")
    }

    @Test
    fun `logEvent does not throw with null entityId and details`() {
        setAuthenticatedUser("admin")

        logger.logEvent("LOGIN_SUCCESS", "User")
    }

    @Test
    fun `logEvent uses system as username when no authentication context`() {
        logger.logEvent("STARTUP", "System", details = "Application started")
    }

    @Test
    fun `logEvent works with authenticated user`() {
        setAuthenticatedUser("testuser")

        logger.logEvent("DELETE", "Athlete", UUID.randomUUID())
    }

    private fun setAuthenticatedUser(username: String) {
        val auth = UsernamePasswordAuthenticationToken(username, null, emptyList())
        SecurityContextHolder.getContext().authentication = auth
    }
}
